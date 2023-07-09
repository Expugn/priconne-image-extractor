const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { PythonShell } = require('python-shell');
const config = require('./config.json');

run();
async function run() {
    // get and save latest version.json
    const latest = await get_latest_version();
    write_file('version.json', latest);

    // get file manifest
    const manifest = get_manifest();

    await download(latest, manifest);
    write_file('manifest.json', manifest, true);
    deserialize();
}

function get_latest_version() {
    return new Promise(async (resolve) => {
        let latest = "";
        https.get(config.version_url, (res) => {
            res.on('data', (chunk) => {
                latest += Buffer.from(chunk).toString();
            });
            res.on('end', () => {
                resolve(JSON.parse(latest));
            });
        });
    });
}

function get_manifest() {
    // get manifest.json, create it if it already doesn't exist
    // manifest.json will hold whatever image paths that were already downloaded and their hashs
    if (!fs.existsSync('manifest.json')) {
        write_file('manifest.json', {});
        return {};
    }
    return JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
}

function download(latest, manifest) {
    return new Promise(async (resolve) => {
        check_directory('unity3d', true); // dir to save .unity3d files
        check_directory('manifests'); // dir to save manifests files
        await Promise.all([
            dl_cn(),
            dl_en(),
            dl_jp(),
            dl_kr(),
            dl_th(),
            dl_tw(),
        ]);

        resolve();
    });

    function dl_cn() {
        return new Promise(async (resolve) => {
            if (!config.CN.enabled) {
                // region not enabled
                resolve();
                return;
            }
            check_directory(path.join('unity3d', 'CN'));
            check_directory(path.join('manifests', 'CN'));

            if (!manifest.CN) {
                manifest.CN = {};
            }

            const url = `https://${latest.CN.cdnAddr}Manifest/AssetBundles/iOS/${latest.CN.version}/manifest/manifest_assetmanifest`;
            const assetmanifest = await dl_manifest(url, false);
            fs.writeFile(path.join('manifests', 'CN', `manifest_assetmanifest.txt`), assetmanifest, async function (err) {
                if (err) throw err;
            });
            for (const line of assetmanifest.split('\n')) {
                if (line === "") {
                    continue;
                }

                // check manifest whitelist/blacklist
                let blacklist_found = false;
                for (const bl_manifest of config.filter.CN.blacklist.manifests) {
                    if (line.indexOf(bl_manifest) > 0) {
                        blacklist_found = true;
                        break;
                    }
                }
                if (blacklist_found) {
                    continue;
                }
                if (config.filter.CN.whitelist.manifests.length > 0) {
                    let whitelist_found = false;
                    for (const wl_manifest of config.filter.CN.whitelist.manifests) {
                        if (line.indexOf(wl_manifest) > 0) {
                            whitelist_found = true;
                            break;
                        }
                    }
                    if (!whitelist_found) {
                        continue;
                    }
                }

                const [_name, hash] = line.split(',');
                const name = _name.split('/')[1]; // split prefix "manifest/" from name
                if (!manifest.CN[name]) {
                    manifest.CN[name] = {};
                }

                if (manifest.CN[name].hash === hash && !config.force_update.manifests) {
                    // hash matches and no force update enabled, no update found
                    continue;
                }

                // update found
                console.log(`update found: CN/${name}`);
                check_directory(path.join('unity3d', 'CN', name));
                manifest.CN[name].hash = hash;

                const assets = await dl_manifest(`https://${latest.CN.cdnAddr}Manifest/AssetBundles/iOS/${latest.CN.version}/${_name}`, false);
                fs.writeFile(path.join('manifests', 'CN', `${name}.txt`), assets, async function (err) {
                    if (err) throw err;
                });

                for (const line of assets.split('\n')) {
                    if (line === "") {
                        continue;
                    }

                    // check asset whitelist/blacklist
                    let blacklist_found = false;
                    for (const bl_asset of config.filter.CN.blacklist.assets) {
                        if (line.indexOf(bl_asset) > 0) {
                            blacklist_found = true;
                            break;
                        }
                    }
                    if (blacklist_found) {
                        continue;
                    }
                    if (config.filter.CN.whitelist.assets.length > 0) {
                        let whitelist_found = false;
                        for (const wl_asset of config.filter.CN.whitelist.assets) {
                            if (line.indexOf(wl_asset) > 0) {
                                whitelist_found = true;
                                break;
                            }
                        }
                        if (!whitelist_found) {
                            continue;
                        }
                    }

                    const [_n, h] = line.split(',');
                    const n = _n.split('/')[1]; // split prefix "a/" from file name
                    if (!manifest.CN[name][n]) {
                        manifest.CN[name][n] = {};
                    }

                    if (manifest.CN[name][n].hash === h && !config.force_update.assets) {
                        // hash matches, no update found
                        continue;
                    }
                    console.log(`update found: CN/${name}/${n}`);
                    manifest.CN[name][n].hash = h;
                    manifest.CN[name][n].version = latest.CN.version;

                    const p = path.join('unity3d', "CN", name, n);
                    const u = `https://${latest.CN.cdnAddr}pool/AssetBundles/iOS/${h.substring(0, 2)}/${h}`;
                    await dl_asset(p, u, false);
                }
            }
            resolve();
        });
    }


    function dl_en() {
        // NOTE: this may no longer work if CDN is offline
        return new Promise(async (resolve) => {
            if (!config.EN.enabled) {
                // region not enabled
                resolve();
                return;
            }
            check_directory(path.join('unity3d', 'EN'));
            check_directory(path.join('manifests', 'EN'));

            if (!manifest.EN) {
                manifest.EN = {};
            }

            const url = `http://${config.EN.host}/dl/Resources/${latest.EN.version}/Jpn/AssetBundles/iOS/manifest/manifest_assetmanifest`;
            const assetmanifest = await dl_manifest(url);
            fs.writeFile(path.join('manifests', 'EN', `manifest_assetmanifest.txt`), assetmanifest, async function (err) {
                if (err) throw err;
            });
            for (const line of assetmanifest.split('\n')) {
                if (line === "") {
                    continue;
                }

                // check manifest whitelist/blacklist
                let blacklist_found = false;
                for (const bl_manifest of config.filter.EN.blacklist.manifests) {
                    if (line.indexOf(bl_manifest) > 0) {
                        blacklist_found = true;
                        break;
                    }
                }
                if (blacklist_found) {
                    continue;
                }
                if (config.filter.EN.whitelist.manifests.length > 0) {
                    let whitelist_found = false;
                    for (const wl_manifest of config.filter.EN.whitelist.manifests) {
                        if (line.indexOf(wl_manifest) > 0) {
                            whitelist_found = true;
                            break;
                        }
                    }
                    if (!whitelist_found) {
                        continue;
                    }
                }

                const [_name, hash] = line.split(',');
                const name = _name.split('/')[1]; // split prefix "manifest/" from name
                if (!manifest.EN[name]) {
                    manifest.EN[name] = {};
                }

                if (manifest.EN[name].hash === hash && !config.force_update.manifests) {
                    // hash matches and no force update enabled, no update found
                    continue;
                }

                // update found
                console.log(`update found: EN/${name}`);
                check_directory(path.join('unity3d', 'EN', name));
                manifest.EN[name].hash = hash;

                const assets = await dl_manifest(`http://${config.EN.host}/dl/Resources/${latest.EN.version}/Jpn/AssetBundles/iOS/${_name}`);
                fs.writeFile(path.join('manifests', 'EN', `${name}.txt`), assets, async function (err) {
                    if (err) throw err;
                });

                for (const line of assets.split('\n')) {
                    if (line === "") {
                        continue;
                    }

                    // check asset whitelist/blacklist
                    let blacklist_found = false;
                    for (const bl_asset of config.filter.EN.blacklist.assets) {
                        if (line.indexOf(bl_asset) > 0) {
                            blacklist_found = true;
                            break;
                        }
                    }
                    if (blacklist_found) {
                        continue;
                    }
                    if (config.filter.EN.whitelist.assets.length > 0) {
                        let whitelist_found = false;
                        for (const wl_asset of config.filter.EN.whitelist.assets) {
                            if (line.indexOf(wl_asset) > 0) {
                                whitelist_found = true;
                                break;
                            }
                        }
                        if (!whitelist_found) {
                            continue;
                        }
                    }

                    const [_n, h] = line.split(',');
                    const n = _n.split('/')[1]; // split prefix "a/" from file name
                    if (!manifest.EN[name][n]) {
                        manifest.EN[name][n] = {};
                    }

                    if (manifest.EN[name][n].hash === h && !config.force_update.assets) {
                        // hash matches, no update found
                        continue;
                    }
                    console.log(`update found: EN/${name}/${n}`);
                    manifest.EN[name][n].hash = h;
                    manifest.EN[name][n].version = latest.EN.version;

                    const p = path.join('unity3d', "EN", name, n);
                    const u = `http://${config.EN.host}/dl/pool/AssetBundles/${h.substring(0, 2)}/${h}`;
                    await dl_asset(p, u);
                }
            }
            resolve();
        });
    }

    function dl_jp() {
        return new Promise(async (resolve) => {
            if (!config.JP.enabled) {
                // region not enabled
                resolve();
                return;
            }
            check_directory(path.join('unity3d', 'JP'));
            check_directory(path.join('manifests', 'JP'));

            if (!manifest.JP) {
                manifest.JP = {};
            }

            const url = `http://${config.JP.host}/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/Windows/manifest/manifest_assetmanifest`;
            const assetmanifest = await dl_manifest(url);
            fs.writeFile(path.join('manifests', 'JP', `manifest_assetmanifest.txt`), assetmanifest, async function (err) {
                if (err) throw err;
            });
            for (const line of assetmanifest.split('\n')) {
                if (line === "") {
                    continue;
                }

                // check manifest whitelist/blacklist
                let blacklist_found = false;
                for (const bl_manifest of config.filter.JP.blacklist.manifests) {
                    if (line.indexOf(bl_manifest) > 0) {
                        blacklist_found = true;
                        break;
                    }
                }
                if (blacklist_found) {
                    continue;
                }
                if (config.filter.JP.whitelist.manifests.length > 0) {
                    let whitelist_found = false;
                    for (const wl_manifest of config.filter.JP.whitelist.manifests) {
                        if (line.indexOf(wl_manifest) > 0) {
                            whitelist_found = true;
                            break;
                        }
                    }
                    if (!whitelist_found) {
                        continue;
                    }
                }

                const [_name, hash] = line.split(',');
                const name = _name.split('/')[1]; // split prefix "manifest/" from name
                if (!manifest.JP[name]) {
                    manifest.JP[name] = {};
                }

                if (manifest.JP[name].hash === hash && !config.force_update.manifests) {
                    // hash matches and no force update enabled, no update found
                    continue;
                }

                // update found
                console.log(`update found: JP/${name}`);
                check_directory(path.join('unity3d', 'JP', name));
                manifest.JP[name].hash = hash;

                const assets = await dl_manifest(`http://${config.JP.host}/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/Windows/${_name}`);
                fs.writeFile(path.join('manifests', 'JP', `${name}.txt`), assets, async function (err) {
                    if (err) throw err;
                });

                for (const line of assets.split('\n')) {
                    if (line === "") {
                        continue;
                    }

                    // check asset whitelist/blacklist
                    let blacklist_found = false;
                    for (const bl_asset of config.filter.JP.blacklist.assets) {
                        if (line.indexOf(bl_asset) > 0) {
                            blacklist_found = true;
                            break;
                        }
                    }
                    if (blacklist_found) {
                        continue;
                    }
                    if (config.filter.JP.whitelist.assets.length > 0) {
                        let whitelist_found = false;
                        for (const wl_asset of config.filter.JP.whitelist.assets) {
                            if (line.indexOf(wl_asset) > 0) {
                                whitelist_found = true;
                                break;
                            }
                        }
                        if (!whitelist_found) {
                            continue;
                        }
                    }

                    const [_n, h] = line.split(',');
                    const n = _n.split('/')[1]; // split prefix "a/" from file name
                    if (!manifest.JP[name][n]) {
                        manifest.JP[name][n] = {};
                    }

                    if (manifest.JP[name][n].hash === h && !config.force_update.assets) {
                        // hash matches, no update found
                        continue;
                    }
                    console.log(`update found: JP/${name}/${n}`);
                    manifest.JP[name][n].hash = h;
                    manifest.JP[name][n].version = latest.JP.version;

                    const p = path.join('unity3d', "JP", name, n);
                    const u = `http://${config.JP.host}/dl/pool/AssetBundles/${h.substring(0, 2)}/${h}`;
                    await dl_asset(p, u);
                }
            }
            resolve();
        });
    }

    function dl_kr() {
        return new Promise(async (resolve) => {
            if (!config.KR.enabled) {
                // region not enabled
                resolve();
                return;
            }
            check_directory(path.join('unity3d', 'KR'));
            check_directory(path.join('manifests', 'KR'));

            if (!manifest.KR) {
                manifest.KR = {};
            }

            const url = `${latest.KR.cdnAddr}dl/Resources/${latest.KR.version}/Kor/AssetBundles/iOS/manifest/manifest_assetmanifest`;
            const assetmanifest = await dl_manifest(url);
            fs.writeFile(path.join('manifests', 'KR', `manifest_assetmanifest.txt`), assetmanifest, async function (err) {
                if (err) throw err;
            });
            for (const line of assetmanifest.split('\n')) {
                if (line === "") {
                    continue;
                }

                // check manifest whitelist/blacklist
                let blacklist_found = false;
                for (const bl_manifest of config.filter.KR.blacklist.manifests) {
                    if (line.indexOf(bl_manifest) > 0) {
                        blacklist_found = true;
                        break;
                    }
                }
                if (blacklist_found) {
                    continue;
                }
                if (config.filter.KR.whitelist.manifests.length > 0) {
                    let whitelist_found = false;
                    for (const wl_manifest of config.filter.KR.whitelist.manifests) {
                        if (line.indexOf(wl_manifest) > 0) {
                            whitelist_found = true;
                            break;
                        }
                    }
                    if (!whitelist_found) {
                        continue;
                    }
                }

                const [_name, hash] = line.split(',');
                const name = _name.split('/')[1]; // split prefix "manifest/" from name
                if (!manifest.KR[name]) {
                    manifest.KR[name] = {};
                }

                if (manifest.KR[name].hash === hash && !config.force_update.manifests) {
                    // hash matches and no force update enabled, no update found
                    continue;
                }

                // update found
                console.log(`update found: KR/${name}`);
                check_directory(path.join('unity3d', 'KR', name));
                manifest.KR[name].hash = hash;

                const assets = await dl_manifest(`${latest.KR.cdnAddr}dl/Resources/${latest.KR.version}/Kor/AssetBundles/iOS/${_name}`);
                fs.writeFile(path.join('manifests', 'KR', `${name}.txt`), assets, async function (err) {
                    if (err) throw err;
                });

                for (const line of assets.split('\n')) {
                    if (line === "") {
                        continue;
                    }

                    // check asset whitelist/blacklist
                    let blacklist_found = false;
                    for (const bl_asset of config.filter.KR.blacklist.assets) {
                        if (line.indexOf(bl_asset) > 0) {
                            blacklist_found = true;
                            break;
                        }
                    }
                    if (blacklist_found) {
                        continue;
                    }
                    if (config.filter.KR.whitelist.assets.length > 0) {
                        let whitelist_found = false;
                        for (const wl_asset of config.filter.KR.whitelist.assets) {
                            if (line.indexOf(wl_asset) > 0) {
                                whitelist_found = true;
                                break;
                            }
                        }
                        if (!whitelist_found) {
                            continue;
                        }
                    }

                    const [_n, h] = line.split(',');
                    const n = _n.split('/')[1]; // split prefix "a/" from file name
                    if (!manifest.KR[name][n]) {
                        manifest.KR[name][n] = {};
                    }

                    if (manifest.KR[name][n].hash === h && !config.force_update.assets) {
                        // hash matches, no update found
                        continue;
                    }
                    console.log(`update found: KR/${name}/${n}`);
                    manifest.KR[name][n].hash = h;
                    manifest.KR[name][n].version = latest.KR.version;

                    const p = path.join('unity3d', "KR", name, n);
                    const u = `${latest.KR.cdnAddr}dl/pool/AssetBundles/${h.substring(0, 2)}/${h}`;
                    await dl_asset(p, u);
                }
            }
            resolve();
        });
    }

    function dl_th() {
        return new Promise(async (resolve) => {
            if (!config.TH.enabled) {
                // region not enabled
                resolve();
                return;
            }
            check_directory(path.join('unity3d', 'TH'));
            check_directory(path.join('manifests', 'TH'));

            if (!manifest.TH) {
                manifest.TH = {};
            }

            const url = `https://${config.TH.host}/PCC/Live/dl/Resources/${latest.TH.version}/Tha/AssetBundles/iOS/manifest/manifest_assetmanifest`;
            const assetmanifest = await dl_manifest(url, false);
            fs.writeFile(path.join('manifests', 'TH', `manifest_assetmanifest.txt`), assetmanifest, async function (err) {
                if (err) throw err;
            });
            for (const line of assetmanifest.split('\n')) {
                if (line === "") {
                    continue;
                }

                // check manifest whitelist/blacklist
                let blacklist_found = false;
                for (const bl_manifest of config.filter.TH.blacklist.manifests) {
                    if (line.indexOf(bl_manifest) > 0) {
                        blacklist_found = true;
                        break;
                    }
                }
                if (blacklist_found) {
                    continue;
                }
                if (config.filter.TH.whitelist.manifests.length > 0) {
                    let whitelist_found = false;
                    for (const wl_manifest of config.filter.TH.whitelist.manifests) {
                        if (line.indexOf(wl_manifest) > 0) {
                            whitelist_found = true;
                            break;
                        }
                    }
                    if (!whitelist_found) {
                        continue;
                    }
                }

                const [_name, hash] = line.split(',');
                const name = _name.split('/')[1]; // split prefix "manifest/" from name
                if (!manifest.TH[name]) {
                    manifest.TH[name] = {};
                }

                if (manifest.TH[name].hash === hash && !config.force_update.manifests) {
                    // hash matches and no force update enabled, no update found
                    continue;
                }

                // update found
                console.log(`update found: TH/${name}`);
                check_directory(path.join('unity3d', 'TH', name));
                manifest.TH[name].hash = hash;

                const assets = await dl_manifest(`https://${config.TH.host}/PCC/Live/dl/Resources/${latest.TH.version}/Tha/AssetBundles/iOS/${_name}`, false);
                fs.writeFile(path.join('manifests', 'TH', `${name}.txt`), assets, async function (err) {
                    if (err) throw err;
                });

                for (const line of assets.split('\n')) {
                    if (line === "") {
                        continue;
                    }

                    // check asset whitelist/blacklist
                    let blacklist_found = false;
                    for (const bl_asset of config.filter.TH.blacklist.assets) {
                        if (line.indexOf(bl_asset) > 0) {
                            blacklist_found = true;
                            break;
                        }
                    }
                    if (blacklist_found) {
                        continue;
                    }
                    if (config.filter.TH.whitelist.assets.length > 0) {
                        let whitelist_found = false;
                        for (const wl_asset of config.filter.TH.whitelist.assets) {
                            if (line.indexOf(wl_asset) > 0) {
                                whitelist_found = true;
                                break;
                            }
                        }
                        if (!whitelist_found) {
                            continue;
                        }
                    }

                    const [_n, h] = line.split(',');
                    const n = _n.split('/')[1]; // split prefix "a/" from file name
                    if (!manifest.TH[name][n]) {
                        manifest.TH[name][n] = {};
                    }

                    if (manifest.TH[name][n].hash === h && !config.force_update.assets) {
                        // hash matches, no update found
                        continue;
                    }
                    console.log(`update found: TH/${name}/${n}`);
                    manifest.TH[name][n].hash = h;
                    manifest.TH[name][n].version = latest.TH.version;

                    const p = path.join('unity3d', "TH", name, n);
                    const u = `https://${config.TH.host}/PCC/Live/dl/pool/AssetBundles/${h.substring(0, 2)}/${h}`;
                    await dl_asset(p, u, false);
                }
            }
            resolve();
        });
    }

    function dl_tw() {
        return new Promise(async (resolve) => {
            if (!config.TW.enabled) {
                // region not enabled
                resolve();
                return;
            }
            check_directory(path.join('unity3d', 'TW'));
            check_directory(path.join('manifests', 'TW'));

            if (!manifest.TW) {
                manifest.TW = {};
            }

            const url = `https://${config.TW.host}/dl/Resources/${`${latest.TW.version}`.padStart(8, '0')}/Jpn/AssetBundles/iOS/manifest/manifest_assetmanifest`;
            const assetmanifest = await dl_manifest(url, false);
            fs.writeFile(path.join('manifests', 'TW', `manifest_assetmanifest.txt`), assetmanifest, async function (err) {
                if (err) throw err;
            });
            for (const line of assetmanifest.split('\n')) {
                if (line === "") {
                    continue;
                }

                // check manifest whitelist/blacklist
                let blacklist_found = false;
                for (const bl_manifest of config.filter.TW.blacklist.manifests) {
                    if (line.indexOf(bl_manifest) > 0) {
                        blacklist_found = true;
                        break;
                    }
                }
                if (blacklist_found) {
                    continue;
                }
                if (config.filter.TW.whitelist.manifests.length > 0) {
                    let whitelist_found = false;
                    for (const wl_manifest of config.filter.TW.whitelist.manifests) {
                        if (line.indexOf(wl_manifest) > 0) {
                            whitelist_found = true;
                            break;
                        }
                    }
                    if (!whitelist_found) {
                        continue;
                    }
                }

                const [_name, hash] = line.split(',');
                const name = _name.split('/')[1]; // split prefix "manifest/" from name
                if (!manifest.TW[name]) {
                    manifest.TW[name] = {};
                }

                if (manifest.TW[name].hash === hash && !config.force_update.manifests) {
                    // hash matches and no force update enabled, no update found
                    continue;
                }

                // update found
                console.log(`update found: TW/${name}`);
                check_directory(path.join('unity3d', 'TW', name));
                manifest.TW[name].hash = hash;

                const assets = await dl_manifest(`https://${config.TW.host}/dl/Resources/${`${latest.TW.version}`.padStart(8, '0')}/Jpn/AssetBundles/iOS/${_name}`, false);
                fs.writeFile(path.join('manifests', 'TW', `${name}.txt`), assets, async function (err) {
                    if (err) throw err;
                });

                for (const line of assets.split('\n')) {
                    if (line === "") {
                        continue;
                    }

                    // check asset whitelist/blacklist
                    let blacklist_found = false;
                    for (const bl_asset of config.filter.TW.blacklist.assets) {
                        if (line.indexOf(bl_asset) > 0) {
                            blacklist_found = true;
                            break;
                        }
                    }
                    if (blacklist_found) {
                        continue;
                    }
                    if (config.filter.TW.whitelist.assets.length > 0) {
                        let whitelist_found = false;
                        for (const wl_asset of config.filter.TW.whitelist.assets) {
                            if (line.indexOf(wl_asset) > 0) {
                                whitelist_found = true;
                                break;
                            }
                        }
                        if (!whitelist_found) {
                            continue;
                        }
                    }

                    const [_n, h] = line.split(',');
                    const n = _n.split('/')[1]; // split prefix "a/" from file name
                    if (!manifest.TW[name][n]) {
                        manifest.TW[name][n] = {};
                    }

                    if (manifest.TW[name][n].hash === h && !config.force_update.assets) {
                        // hash matches, no update found
                        continue;
                    }
                    console.log(`update found: TW/${name}/${n}`);
                    manifest.TW[name][n].hash = h;
                    manifest.TW[name][n].version = latest.TW.version;

                    const p = path.join('unity3d', "TW", name, n);
                    const u = `https://${config.TW.host}/dl/pool/AssetBundles/${h.substring(0, 2)}/${h}`;
                    await dl_asset(p, u, false);
                }
            }
            resolve();
        });
    }

    function dl_manifest(url, is_http = true) {
        console.log(`[dl_manifest] ${url}`)
        return new Promise(async (resolve) => {
            let bundle = "";
            if (is_http) {
                http.request(url, (res) => {
                    res.on('data', function(chunk) {
                        bundle += Buffer.from(chunk).toString();
                    });
                    res.on('end', () => {
                        resolve(bundle);
                    });
                }).end();
                return;
            }
            // https
            https.get(url, (res) => {
                res.on('data', function(chunk) {
                    bundle += Buffer.from(chunk).toString();
                });
                res.on('end', () => {
                    resolve(bundle);
                });
            }).end();
        });
    }

    function dl_asset(file_path, url, is_http = true) {
        console.log(`[dl_asset] ${url} -> ${file_path}`);
        const file = fs.createWriteStream(file_path);
        return new Promise(async (resolve) => {
            if (is_http) {
                http.get(url, (res) => {
                    const stream = res.pipe(file);
                    stream.on('finish', () => {
                        resolve();
                    });
                }).end();
                return;
            }
            // https
            https.get(url, (res) => {
                const stream = res.pipe(file);
                stream.on('finish', () => {
                    resolve();
                });
            }).end();
        });
    }
}

function deserialize() {
    // UnityPack can't handle iOS/Android files from EN/KR/TW servers.
    // Only JP files will be auto-deserialized.
    // Use https://github.com/Perfare/AssetStudio to extract other region's files

    // UPDATE: May 15th 2023:
    // Updated from UnityPack to UnityPy, this library can handle iOS files.
    // https://github.com/Perfare/AssetStudio may have issues in the future if other regions remove the Unity version from SerializedFiles and BundleFiles

    return new Promise(async (resolve) => {
        if (!fs.existsSync(path.join('unity3d'))) {
            // unity3d directory doesn't exist, meaning probably no new files
            resolve();
            return;
        }
        console.log("starting deserialization process (this may take a really long time...)");

        await Promise.all([
            de("CN"),
            de("JP"),
            de("KR"),
            de("TH"),
            de("TW"),
        ]);

        resolve();
    });

    function de(region = "JP") {
        return new Promise(async (resolve) => {
            const unity3d_dir = path.join('unity3d', region);
            if (!fs.existsSync(unity3d_dir)) {
                resolve();
                return;
            }

            read_directory(unity3d_dir);

            function read_directory(dir) {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const f_path = path.join(dir, file);
                    if (fs.statSync(f_path).isDirectory()) {
                        read_directory(f_path);
                    }
                    else {
                        // assumed .unity3d file
                        unitypy(f_path);
                    }
                }
            }
            resolve();
        });
    }

    function unitypy(import_path, silent = false) {
        // MAKE SURE TO RUN IN PYTHON 3, PYTHON 2 DOES NOT WORK
        const shell = new PythonShell(`${__dirname}/deserialize.py`, { args: [import_path], pythonPath: 'python' });
        shell.on('message', (message) => {
            if (!silent) {
                console.log(message);
            }
        })
        shell.end((err, code, signal) => {
            if (err) throw err;
            // delete .unity3d file
            fs.rmSync(import_path);
        });
    }
}

function check_directory(directory, clean = false) {
    if (!directory) {
        return;
    }

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }

    if (clean) {
        clean_directory(directory);
    }

    function clean_directory(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                clean_directory(path.join(dir, file));
                fs.rmdirSync(path.join(dir, file));
            }
            else {
                fs.unlinkSync(path.join(dir, file));
            }
        }
    }
}

function write_file(path, data, readable = false) {
    fs.writeFile(path, JSON.stringify(data, null, readable ? 4 : 0), async function (err) {
        if (err) throw err;
    });
}