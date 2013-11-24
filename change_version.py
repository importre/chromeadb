# -*- coding: utf-8 -*-

__author__ = 'importre'

import argparse
import json
import re
import sys

json_files = ('package.json', 'bower.json', 'src/manifest.json',)

def get_argparser():
    parser = argparse.ArgumentParser(description='Modify ChromeADB version.')
    parser.add_argument('-n', help='new version. ex) 1.0.0')
    return parser

def is_valid_version(ver):
    if not ver or not re.match('^(\d+\.){2}\d+$', ver.strip()):
        return False
    return True

if __name__ == '__main__':
    parser = get_argparser()
    ver = parser.parse_args().n

    if not is_valid_version(ver):
        parser.print_help()
        sys.exit(1)

    json_data = []
    try:
        ver
        for json_file in json_files:
            with open(json_file) as fin:
                data = json.load(fin, 'utf_8')
                data['version'] = ver
                json_data.append(data)
    except Exception as why:
        print why
        sys.exit(1)

    for name, data in zip(json_files, json_data):
        with open(name, 'w') as fout:
            json.dump(data, fout, indent=4, separators=(',', ': ',), sort_keys=True)
    pass
