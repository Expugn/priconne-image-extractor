import sys
import os
import pathlib
from vendor.UnityPy import UnityPy

def open_texture2d(import_path):
    # count Texture2Ds first
    count = 0
    env = UnityPy.load(import_path)
    for obj in env.objects:
        if obj.type.name in ["Texture2D"]:
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
        env = UnityPy.load(import_path)
        for obj in env.objects:
            if obj.type.name in ["Texture2D"]:
                data = obj.read()
                img = data.image

                if multiple:
                    export_path = os.path.join(export_dir, data.name + '.png')
                else:
                    export_path = os.path.join(export_dir, os.path.basename(import_path).split('.')[0] + '.png')

                img.save(export_path)
                print('<DESERIALIZE>', import_path, '->', export_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Not enough arguments.')
        sys.exit()
    open_texture2d(sys.argv[1])