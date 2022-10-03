

<!--
```
templates
 L jp-mining-note
 L macros
    - general macros used throughout the note generation template.
 L modules
    - primarily javascript
    - used to separate collections of code that can be added / removed to the note at will.
 L scss    # contains all the css generated
```
-->



# Technical Summary
The Anki card template is generated through `jinja` templates,
which is a popular templating engine for `Python`.
All of these templates are located under the `(root)/src` folder.

The Anki templates are generated through a combination of
`sass` (for css) and `jinja` (for everything else),
through the `tools/make.py` script.

You must build the note to use compile-time options,
as by definition, compile-time options are applied when the note is built.


!!! note

    The instructions listed below will be primarily Linux based.
    Notes for other operating systems may be shown, but are not guaranteed.

    It is also assumed that you have knowledge of basic command line.



# Building

## Prerequisites
- Python 3.10.6 or higher
    - I recommend [pyenv](https://github.com/pyenv/pyenv) to upgrade your python version
      if you're running linux. and have a lower version of Python.
- [sass](https://sass-lang.com/dart-sass) (dart implementation)
    - The dart implementation is required to use the latest features of sass.
- Anki 2.1.54 or higher
- Anki-Connect addon


## Initialization

```bash
git clone https://github.com/Aquafina-water-bottle/jp-mining-note.git
cd jp-mining-note
# alternatively, if you already have the repository on your system:
git pull origin/master

# You may have to use `python` instead of `python3`, and `pip` instead of `pip3`.
python3 -m venv .

# The following is for POSIX (bash/zsh) only.
# See how to activate venv on your system in the official documentation:
# https://docs.python.org/3/library/venv.html
source ./bin/activate

pip3 install -r tools/requirements.txt
```

Disabling the venv:
```bash
deactivate
```

Resetting the venv:
```bash
# run this only if you're already in a venv
deactivate

rm -r bin lib
python3 -m venv .
source ./bin/activate
pip3 install -r tools/requirements.txt
```


!!! note

    The `master` branch is the bleeding edge version of the note.
    If you want to build a more stable version of the note, do the following:
    ```bash
    git fetch
    git checkout tags/TAG_NAME

    # or if you want to create a new branch as well:
    git checkout tags/TAG_NAME -b BRANCH_NAME

    # to return back to the master branch, after you're done building:
    git checkout master
    ```


!!! note

    It is highly recommended that you use venv, or something else that isolates
    the python environment.
    However, in case you don't want to use `venv`, you can manually install the dependencies:
    ```bash
    pip3 install JSON-minify jinja2 black pytest
    ```

<!--
Additional packages I use for development on my local system are:
```
pip3 install neovim anki aqt
```
-->

## Building and Installing


```bash
cd tools

# Builds into a temporary folder and installs
# WARNING: completely overrides current note that is installed
python3 ./main.py
```


!!! note

    Running the ./main.py script is equivalent of running:
    ```bash
    # builds the note into the ./build folder
    python3 make.py

    # installs the note from the ./build folder
    python3 install.py --from-build --update
    ```


## Running Tests
```bash
cd tools
python3 -m pytest ./tests
```

## Building the Documentation

- all documentation files are found under `(root)/docs`.
- if already done the above steps with the requirements.txt, all dependencies should already be installed
- main files should be found under docs/docs/PAGE.md

to preview the documentation:
```bash
mkdocs serve
```


!!! note
    If you are not using requirements.txt and venv, you can install the
    dependencies manually here:
    ```bash
    pip3 install mkdocs mkdocs-video mkdocs-material mkdocs-macros-plugin \
            mkdocs-git-revision-date-localized-plugin
    ```

<!-- TODO update requirements.txt to include last git-revision requirement -->



# Common Errors
- TODO fill out as people start working with this note



# Conclusion
After your first successful build, you can now use compile-time options!
See [this page](compileopts.md) for more info.


