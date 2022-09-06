import sys
import os
import pathlib
from io import BytesIO
from vendor.UnityPack import unitypack

def open_texture2d(import_path):
    # count Texture2Ds first
    count = 0
    with open(import_path, 'rb') as f:
        bundle = unitypack.load(f)
        for asset in bundle.assets:
            for id, object in asset.objects.items():
                if object.type == 'Texture2D':
                    count += 1

    if count == 0:
        # no Texture2D files
        return

    # assuming more than 1 Texture2D file
    deserialize(import_path, multiple=(count > 1))


def deserialize(import_path, multiple=False):
    if multiple:
        export_dir = pathlib.Path(*pathlib.Path(import_path).parts[1:]) # remove "unity3d\", has .unity3d still
        export_dir = os.path.splitext(export_dir)[0] # no file extension, good if mkdir
    else:
        export_dir = pathlib.Path(*pathlib.Path(import_path).parts[1:-1]) # remove "unity3d\" and file name/ext
    export_dir = os.path.join("image", export_dir) # prefix with "image"

    # make sure export_dir exists
    if not os.path.exists(export_dir):
        os.makedirs(export_dir) # makedirs if it doesn't exist

    with open(import_path, 'rb') as f:
        bundle = unitypack.load(f)
        for asset in bundle.assets:
            for id, object in asset.objects.items():
                if object.type == 'Texture2D':
                    data = object.read()
                    try:
                        from PIL import ImageOps
                    except ImportError:
                        print('ImportError')
                        continue
                    try:
                        image = data.image
                    except NotImplementedError:
                        print('\tNotImplementedError')
                        continue
                    if image is None:
                        print('\tEmpty Image')
                        continue
                    img = ImageOps.flip(image)
                    output = BytesIO()
                    img.save(output, format='png')

                    if multiple:
                        export_path = os.path.join(export_dir, data.name + '.png')
                    else:
                        export_path = os.path.join(export_dir, os.path.basename(import_path).split('.')[0] + '.png')

                    with open(export_path, 'wb') as fi:
                        fi.write(output.getvalue())
                        print('<DESERIALIZE>', import_path, '->', export_path)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Not enough arguments.')
        sys.exit()
    open_texture2d(sys.argv[1])