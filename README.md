# priconne-image-extractor

## Information
This is a quickly thrown together script that focuses on downloading and extracting image/Texture2D assets from
different regions of `Princess Connect! Re:Dive`'s content delivery networks.

***The stability of this script is not guaranteed to be stable, and is not guaranteed to be fixed or improved on.***

Extracted files may take up a lot of space on your hard drive. *Please make sure you have enough space before using this.*

## Supported Regions
- English
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
- `UnityPack` (provided) <https://github.com/HearthSim/UnityPack>
- `lz4` (`pip install lz4`) <https://pypi.org/project/lz4/>
- `Pillow` (`pip install Pillow`) <https://pypi.org/project/Pillow/>
- `decrunch` (`pip install decrunch`) <https://pypi.org/project/decrunch/>

## Running The Script
With a command prompt open that's pointing to the directory where all the project files are saved:
```
node app.js
```

## Auto Image Extracting
Auto image extracting is only available for Japanese server assets. This is because `UnityPack` does not support
assets from iOS or Android game versions.

If you need English/Korean/Taiwan assets, you can still get them through this script, but you will need to use a
tool like <https://github.com/Perfare/AssetStudio> to `Load Folder` or `Load File` to get the images.

## config.json
Before you run the script for the first time, it is recommended that you edit the `config.json` to make sure every
thing appears to be in order and you aren't fetching files you don't need. If you choose to download/deserialize
everything, the entire process may take a very long time.

### Enabling Regions
Regions can be enabled/disabled by switching the `enabled` value to be `true`/`false`

## Force Update
Turning force update on will cause files to be redownloaded even if they may be the latest version.

## Manifest and Asset Filters (Whitelist/Blacklist)
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