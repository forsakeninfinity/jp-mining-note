"""
both generates files and updates anki card template
"""

import make
import install
import utils


def main():
    args = utils.get_args(utils.add_args, make.add_args, install.add_args)

    # defaults to install from the build folder
    args.from_build = True

    make.main(args=args)
    install.main(args=args)


if __name__ == "__main__":
    main()