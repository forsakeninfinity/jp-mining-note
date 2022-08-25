"""
https://github.com/Ajatt-Tools/AnkiNoteTypes/blob/main/antp/updater.py
https://github.com/FooSoft/anki-connect#model-actions
updateModelTemplates
"""

import os
import base64
import datetime
from dataclasses import dataclass

from typing import Any, Dict, List

import utils
from utils import invoke

# from note_changes import NoteChanges


# NOTE_TYPES_DIR = "cards"
FRONT_FILENAME = "front.html"
BACK_FILENAME = "back.html"
# CSS_FILEPATH = "cards/style.css"
CSS_FILENAME = "style.css"

# OPTIONS_FILENAME = "jp-mining-note-options.js"
# FIELD_FILENAME = "field.css"

# MODEL_NAME = "JP Mining Note"
TEMPLATE_NAMES = {
    "main": "Mining Card",
    "pa_sent": "PA Sentence Card",
    # "pa_word": "PA Word Card",
    # "cloze_deletion": "Cloze Deletion Card",
}


@dataclass(frozen=True)
class CardTemplate:
    name: str
    front: str
    back: str


@dataclass(frozen=True)
class NoteType:
    name: str
    css: str
    templates: List[CardTemplate]


@dataclass(frozen=True)
class MediaFile:
    name: str
    contents: str


def add_args(parser):
    group = parser.add_argument_group(title="install")
    group.add_argument("--install-options", action="store_true")
    group.add_argument(
        "-u",
        "--update",
        action="store_true",
        help="updates the note instead of installing it",
    )
    # group.add_argument("-o", "--install-options", action="store_true")
    # group.add_argument("-m", "--install-media", action="store_true")
    # group.add_argument("-a", "--install-all", action="store_true")
    group.add_argument(
        "--from-build",
        action="store_true",
        help="installs files directly from the build folder, "
        "rather than the release files",
    )

    # TODO implement
    # force update version
    # group.add_argument("--force", action="store_true")


# def format_create_model(model: NoteType) -> Dict[str, Any]:
#    return {
#        "modelName": "newModelName",
#        "inOrderFields": ["Field1", "Field2", "Field3"],
#        "css": "Optional CSS with default to builtin css",
#        "isCloze": False,
#        "cardTemplates": [
#            {
#                "Name": "My Card 1",
#                "Front": "Front html {{Field1}}",
#                "Back": "Back html  {{Field2}}",
#            }
#        ],
#    }


# def to_base64_str(string: str) -> str:
#    return base64.b64encode(bytes(string, "utf-8")).decode("utf-8")


# class NoteReader:
class NoteUpdater:
    def __init__(self, input_folder: str):
        self.input_folder = input_folder
        # self.note_model_id = note_model_id
        # self.templates = templates

    def read_css(self, note_config: utils.Config) -> str:
        # with open(os.path.join(self.input_folder, CSS_FILENAME), encoding="utf8") as f:
        input_path = os.path.join(
            self.input_folder, str(note_config.key()), CSS_FILENAME
        )
        with open(input_path, encoding="utf8") as f:
            return f.read()

    def get_templates(self, note_config: utils.Config) -> List[CardTemplate]:
        templates = []
        for template_id, template_config in note_config("templates").dict_items():
            template_name = template_config("name").item()
            dir_path = os.path.join(
                self.input_folder, str(note_config.key()), template_id
            )

            with open(os.path.join(dir_path, FRONT_FILENAME), encoding="utf8") as front:
                front_contents = front.read()
            with open(os.path.join(dir_path, BACK_FILENAME), encoding="utf8") as back:
                back_contents = back.read()

            templates.append(CardTemplate(template_name, front_contents, back_contents))

        return templates

    def read_model(self, note_config: utils.Config) -> NoteType:
        model_name = note_config("model-name").item()

        return NoteType(
            name=model_name,
            css=self.read_css(note_config),
            templates=self.get_templates(note_config),
        )

    # def read_options_file() -> str:
    #    with open(os.path.join("media", OPTIONS_FILENAME), encoding='utf8') as f:
    #        return f.read()
    #
    # def read_options_media() -> MediaFile:
    #    return MediaFile(name=OPTIONS_FILENAME, contents=to_base64_str(read_options_file()))

    # taken from https://github.com/Ajatt-Tools/AnkiNoteTypes/blob/main/antp/updater.py
    def format_templates(self, model: NoteType) -> Dict[str, Any]:
        return {
            "model": {
                "name": model.name,
                "templates": {
                    template.name: {"Front": template.front, "Back": template.back}
                    for template in model.templates
                },
            }
        }

    def format_styling(self, model: NoteType) -> Dict[str, Any]:
        return {"model": {"name": model.name, "css": model.css}}

    def update(self, note_config: utils.Config):
        model = self.read_model(note_config)
        if invoke("updateModelTemplates", **self.format_templates(model)) is None:
            template_names = [t.name for t in model.templates]
            print(f"Updated {note_config.key()} templates {template_names} successfully.")
        if invoke("updateModelStyling", **self.format_styling(model)) is None:
            print(f"Updated {note_config.key()} css successfully.")


def b64_decode(contents):
    """
    turns b64 string into string
    """
    return base64.b64decode(contents).decode("utf-8")


def b64_encode(contents):
    """
    turns string into b64 string (as opposed to a binary object)
    """
    return base64.b64encode(contents).decode("utf-8")


class MediaInstaller:
    def __init__(self, input_folder: str, backup_folder: str):
        self.input_folder = input_folder
        self.backup_folder = backup_folder
        # self.media_files = None:

    def get_media_file(self, file_name) -> MediaFile:
        with open(os.path.join(self.input_folder, file_name), mode="rb") as f:
            contents = f.read()
        # print(contents)
        return MediaFile(
            name=file_name, contents=base64.b64encode(contents).decode("utf-8")
        )

        # if binary:
        # else:
        #    with open(os.path.join(self.input_folder, file_name), encoding="utf8") as f:
        #        contents = f.read()
        #    return MediaFile(name=file_name, contents=to_base64_str(contents))

    def backup(self, file_name):
        # attempts to file from anki
        contents_b64 = invoke("retrieveMediaFile", filename=file_name)
        if not contents_b64:
            # file doesn't exist in the first place, nothing to backup
            print(f"No backup is necessary: `{file_name}` doesn't exist")
            return

        contents = base64.b64decode(contents_b64).decode("utf-8")

        TIME_FORMAT = "%Y-%m-%d-%H-%M-%S"
        backup_file = datetime.datetime.now().strftime(TIME_FORMAT) + "---" + file_name
        backup_file_path = os.path.join(self.backup_folder, backup_file)
        print(f"Backing up `{file_name}` -> `{os.path.relpath(backup_file_path)}` ...")

        utils.gen_dirs(backup_file_path)
        with open(backup_file_path, mode="w") as f:
            f.write(contents)

        # with open(os.path.join(self.input_folder, file_name), mode="rb") as f:
        #    contents = f.read()
        ## print(contents)
        # return MediaFile(
        #    name=file_name, contents=base64.b64encode(contents).decode("utf-8")
        # )

    def format_media(self, media: MediaFile) -> Dict[str, Any]:
        return {
            "filename": media.name,
            "data": media.contents,
        }

    def send_media(self, media: MediaFile):
        if invoke("storeMediaFile", **self.format_media(media)) == media.name:
            print(f"Updated '{media.name}' media file successfully.")

    def media_exists(self, file_name: str):
        # if self.media_files is None:
        return bool(invoke("getMediaFilesNames", pattern=file_name))

    def install(self, file_name: str, static=False, backup=False):
        if static:
            # only adds if the media file doesn't already exist
            if self.media_exists(file_name):
                return
        if backup and self.media_exists(file_name):
            self.backup(file_name)

        media = self.get_media_file(file_name)
        # return
        self.send_media(media)


def main(args=None):
    if args is None:
        args = utils.get_args(utils.add_args, add_args)
    # if args.release:
    #    args.from_release = True

    # config = utils.get_config(args)
    notes_files_config = utils.get_note_files_config()

    # checks if the note has to be changed first outside templates / media files
    # note_changes = NoteChanges()
    # if note_changes.has_changes():
    #    pass

    options_media = set()
    static_media = set()
    dynamic_media = set()

    root_folder = utils.get_root_folder()

    note_folder = args.build_folder if args.from_build else root_folder
    note_updater = NoteUpdater(note_folder)
    for note_config in notes_files_config.dict_values():
        # note_installer = NoteInstaller(
        #    args.folder,
        #    config("note", note_model_id),
        #    # config("note", note_model_id, "templates").dict(),
        # )

        model_name = note_config("model-name").item()
        if utils.note_is_installed(model_name):
            # print(f"Updating {model_name}...")

            if not args.update:
                print(
                    f"{model_name} is already installed. Did you mean to update?\n"
                    "To update, run `python3 install.py --update`",
                )
                return

            print(f"Updating {model_name}...")
            note_updater.update(note_config)

        else:
            print(f"Installing {model_name}...")
            version = utils.get_version()
            # TODO note-independent file name
            install_path = os.path.join(root_folder, "all_versions", f"{version}-jpmn_example_cards.apkg")

            #invoke("importPackage", path=install_path)

        options_media |= set(note_config("media-install", "options").list())
        static_media |= set(note_config("media-install", "static").list())
        dynamic_media |= set(note_config("media-install", "dynamic").list())

    media_folder = (
        os.path.join(args.build_folder, "media")
        if args.build_folder
        else os.path.join(root_folder, "media")
    )
    backup_folder = os.path.join(root_folder, "backup")

    media_installer = MediaInstaller(media_folder, backup_folder)

    for media_file in dynamic_media:
        media_installer.install(media_file, static=False)
    for media_file in static_media:
        media_installer.install(media_file, static=True)

    if args.install_options:
        for media_file in options_media:
            # backs up existing options
            media_installer.install(media_file, static=False, backup=True)

    # media_installer.install("test_silence.wav", binary=True)
    # media_installer.install("NotoSerifJP-Bold.otf")

    # model = reader.read_model()
    # send_note_type(model)

    # if args.install_options or args.install_all:
    #    options_media = reader.get_media_file(OPTIONS_FILENAME, dir_name=args.folder)
    #    send_media(options_media)

    # if args.install_media or args.install_all:
    #    options_media = reader.get_media_file(FIELD_FILENAME)
    #    send_media(options_media)


if __name__ == "__main__":
    main()

    # tools_folder = os.path.dirname(os.path.abspath(__file__))
    # root_folder = os.path.join(tools_folder, "..")

    # media_folder = os.path.join("build", "media")
    # media_installer = MediaInstaller(media_folder)

    # media_installer.install("_jpmn-options.js", static=True)