# Step file converter

Convert cad files with `ClassCAD` and `buerli`.

The converter runs directly in a `node.js` process.

## Installation

```shell
mkdir stepfile-converter
cd stepfile-converter
git clone https://github.com/dm385/stepfile-converter .
npm i
```

## Usage

> Make sure you have set the `CLASSCAD_URL` in `.env` to an existing ClassCAD server.

There is a sample step file available in the repo. It is located at `./res`.

```shell
npm run start -- ./res/as1_ac_214.stp
```

Have a look at the `.temp` folder. It should contain a file named `as1_ac_214.stp.json`.
