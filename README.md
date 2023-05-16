# priconne-image-extractor

## Information
This is a quickly thrown together script that focuses on downloading and extracting image/Texture2D assets from
different regions of `Princess Connect! Re:Dive`'s content delivery networks.

***The stability of this script is not guaranteed to be stable, and is not guaranteed to be fixed or improved on.***

Extracted files may take up a lot of space on your hard drive. *Please make sure you have enough space before using this.*

## REGARDING `priconne-jp`'S Unity UPDATE **(FUTURE MANUAL UPDATES MAY BE NEEDED)**
Since `priconne-jp`'s Unity update on `April 10th, 2023`, SerializedFiles and BundleFiles no longer provide the Unity
version being used. Unity may update again in the future, and will break this image extractor again.

UnityPy offers a way to set a `UNITY_FALLBACK_VERSION` through its [`config.py`](vendor/UnityPy/UnityPy/config.py) file<br/>
If this program breaks from another Unity update, you can easily get the Unity version being used if you have the DMM version of the game installed:
- Locate `PrincessConnectReDive.exe` in `DMM/priconner/` (Open game folder via DMM to locate this path easier)
- Right-click `PrincessConnectReDive.exe` and click `Properties`
- Under `Details` tab, see the value under "`Product version`". Copy and replace this value to `config.py`'s `UNITY_FALLBACK_VERSION` if needed.

## Supported Regions
- ~~English~~
  - English server has ended service as of `April 30, 2023 (UTC)`, CDN server may be offline
    - <https://twitter.com/priconne_en/status/1652477875331932161>
- Japanese
- Korean
- Taiwan

## Requirements
### System
- Node.js `v16.16.0` or above
- Python 3

### app.js
- `python-shell` (`npm install python-shell`) <https://www.npmjs.com/package/python-shell>

### deserialize.py
- `UnityPy` (provided) <https://github.com/K0lb3/UnityPy>

## Running The Script
With a command prompt open that's pointing to the directory where all the project files are saved:
```
node app.js
```

## Auto Image Extracting
As of `May 15th, 2023`, auto image extracting is available for all servers thanks to the `UnityPack` -> `UnityPy` upgrade.

All downloaded `unity3d` files will automatically be extracted after download process.

## config.json
Before you run the script for the first time, it is recommended that you edit the `config.json` to make sure every
thing appears to be in order and you aren't fetching files you don't need. If you choose to download/deserialize
everything, the entire process may take a very long time.

### Enabling Regions
Regions can be enabled/disabled by switching the `enabled` value to be `true`/`false`

### Force Update
Turning force update on will cause files to be redownloaded even if they may be the latest version.

### Manifest and Asset Filters (Whitelist/Blacklist)
***It is recommended to set this to only files you are interested in before using this script for the first time.***

Filters can help you download only specific game assets that you're interested in.

`manifests` are the "assetmanifest" files that index all files related to their category. e.g. `unit2_assetmanifest` for
unit related assets and `storydata2_assetmanifest` for any story related assets

`assets` are the specific individual files in `manifests`. e.g. files prefixed with `unit_icon_unit_` are unit icons for
characters.

Add file names that you want to ignore to the `blacklist`, add file names you only want to focus on to the `whitelist`.

For example, to only download character unit icons you can set your filter to be as so:
```json
"JP": {
    "blacklist": {
        "manifests": [],
        "assets": []
    },
    "whitelist": {
        "manifests": [
            "unit"
        ],
        "assets": [
            "unit_icon_unit_1"
        ]
    }
},
```

If you want to whitelist/blacklist multiple files, you can do so like so:
```json
"blacklist": {
    "manifests": [
        "all",
        "storydata"
    ],
    "assets": [
        "unit_icon_shadow_",
        "unit_icon_unit_2"
    ]
}
```
