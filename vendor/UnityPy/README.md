# UnityPy (Modified)
Please support the original release: <https://github.com/K0lb3/UnityPy>

## Notes
### Regarding FALLBACK_UNITY_VERSION Changes
Since `priconne-jp`'s Unity update on `April 10th 2023`, Unity version is no longer provided in SerializedFiles and BundleFiles.

By editing UnityPy's `config.py`, we can set the Unity version to use. This may need to be updated in the future if `priconne-jp`
decides to update Unity again.

You can get the Unity version that `priconne-jp` is using easily if you have the DMM version of the game installed.
- Find `PrincessConnectReDive.exe` in `DMM/priconner/` (open game folder via DMM to find this location easier)
- Right-Click `PrincessConnectReDive.exe` -> Properties -> Details tab
- "`Product version`" in details should be the `FALLBACK_UNITY_VERSION` value to use, if this has changed, update `config.py`

## File Changes
### config.py
#### OLD
```py
FALLBACK_UNITY_VERSION = "2.5.0f5"
FALLBACK_VERSION_WARNED = False
```
#### NEW
```py
FALLBACK_UNITY_VERSION = "2021.3.20f1"
FALLBACK_VERSION_WARNED = True
```