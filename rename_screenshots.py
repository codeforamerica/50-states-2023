import os
import re
import json
from pprint import pprint

from_directory = "nc-epass-mobile"
regex_pattern = re.compile("NC_ePass_M_(?P<number>\d?\d).*\_Full.png")
existing_sections = {
    "landing": [1, 1],
    "registration": [2, 11],
    "id-proofing": [16, 21],
    "household": [22, 33],
    "income-assets-expenses": [36, 52]
}

jurisdiction = "nc"
application = "epass"
# device = "desktop"
device = "mobile"
to_directory = "screenshots"
file_naming_prefix = f"{jurisdiction}-{application}-{device}"


def main():
    # record all the filenames and extract their numbers
    files = os.listdir(from_directory)
    file_info = []
    for existing_filename in files:
        regex_match = re.match(regex_pattern, existing_filename)
        if regex_match: # skip .DS_Store and filenames that don't match the pattern
            number = int(regex_match.group("number"))
            existing_path = os.path.join(from_directory, existing_filename)
            file_info.append({
                "parsed_number": number,
                "existing_filename": existing_filename,
                "existing_path": existing_path
            })

    # sort filenames based on their numbers
    numbering_map = {}
    file_info = sorted(file_info, key=lambda datum: datum["parsed_number"])
    
    for i, datum in enumerate(file_info):
        # record the map of the manually typed number to the enumeration
        numbering_map[datum["parsed_number"]] = i
        new_filename = f"{file_naming_prefix}-{i:03d}.png"
        new_path = os.path.join(to_directory, new_filename)
        os.rename(datum["existing_path"], new_path)
    
    # build a json of data about the sections
    section_json_path = os.path.join(to_directory, f"{file_naming_prefix}-sections.json")
    section_map = {}
    for section, pages in existing_sections.items():
        section_map[section] = [
            numbering_map[pages[0]],
            numbering_map[pages[1]]
        ]
    # save the json data to a file
    with open(section_json_path, "w") as f:
        f.write(json.dumps(section_map, indent = 2))

main()