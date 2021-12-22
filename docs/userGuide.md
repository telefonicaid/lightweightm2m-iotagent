# OMA Lightweight M2M IoT Agent: User and Development Guide

-   [General Overview](#general-overview)
-   [Getting started](#getting-started)
-   [Project Testing](#project-testing)
-   [Development](#development)

## General Overview

The Lightweight M2M IoT Agent is a standard FIWARE IoT Agent that implements the bridge of the OMA Lightweight M2M
protocol with the internal protocol for the FIWARE components (OMA NGSI). This IoT Agent is based in the public Node.js
IoT Agent Library, where more information can be found about what the IoT Agents are and their different APIs.

This project has, then, two APIs:

-   The API for traffic south of the IoT Agent (LWM2M): information about it can be found in the
    [OMA Lightweight M2M](https://omaspecworks.org/what-is-oma-specworks/iot/lightweight-m2m-lwm2m/) official page.
    Information about the subset of Lightweight M2M already supported can be found in the
    [LWM2M Library for Node.js](https://github.com/telefonicaid/lwm2m-node-lib) we are using.
-   The North Port Administration API: all the IoT Agents share a single Administration API, and it can be found in the
    [Node.JS IoT Agent Library Documentation](https://github.com/telefonicaid/iotagent-node-lib).
-   The API for traffic north of the IoT Agent (NGSI): information about the North Port NGSI mapping can be obtained in
    the same Node.JS IoT Agent Library documentation.

You will find examples and more detailed information in the Getting Started how-tos below.

## Getting started

This document links a set of how-tos oriented to give a quick step-by-step example on how to use the agent with
different types of configurations. It's important to remark that those configuration options are not mutually exclusive:
an IoT Agent can have some device pre-provisioned, some configuration groups defined and some static configurations
also, each for different types of devices.

Some of the guides will share the use of a faked device type called `Robot` with the following characteristics:

-   be part of the service `factory` and subservice `/robots`.
-   have an active attribute called `Battery` with type `number`, mapped to the LWM2M resource ID /7392/0/1.
-   have a passive attribute called `Message` with type `string`, mapped to the LWM2M resource ID /7392/0/2.
-   have a command attribute called `Position` with type `location`, mapped to the LWM2M resource ID /7392/0/3.

Some guides will show the use of the automatic OMA Registry mapping, using a faked device of type 'WeatherBaloon', with
the following characteristics:

-   be part of the service `weather` and subservice `/baloons`.
-   a passive attribute with resource ID /6/0/0 (Position: Longitude).
-   a passive attribute with resource ID /6/0/1 (Position: Latitude).
-   a passive attribute with resource ID /3303/0/0 (Temperature Sensor).
-   an active attribute with resource ID /3312/0/0 (Power Control).

Each guide is presented with a brief explanation about its contents:

-   [Device Provisioning Guide](deviceProvisioning.md): this guide shows how to configure, launch and use an IoT Agent,
    provisioning each device before sending its measures.
-   [Configuration Provisioning Guide](configurationProvisioning.md): this guide shows how to configure a group of
    devices for being auto-provisioned when they register in the agent.
-   [Static Configuration Guide](staticConfiguration.md): this guide shows how to configure static routes that map
    incoming devices to different statically configured types.

## Testing

The IoT Agent comes with a test suite to check the main functionalities. You can execute the tests using:

```bash
npm test
```

This will execute the functional tests.

NOTE: This are end-to-end tests, so they execute against real instances of the components (so make sure you have a real
Context Broker configured in the config.js). Be aware that the tests clean the databases before and after they have been
executed so DO NOT EXECUTE THIS TESTS ON PRODUCTION MACHINES.

It must be also noted that although the lightweightM2M-iotagent works with MongoDB replica sets, the unit testing suite
and its scripts require using a single MongoDB instance.

## Development

### Contribution Guidelines

#### Overview

Being an Open Source project, everyone can contribute, provided that it respect the following points:

-   Before contributing any code, the author must make sure all the tests work (see below how to launch the tests).
-   Developed code must adhere to the syntax guidelines enforced by the linters.
-   Code must be developed following the branching model and change log policies defined below.
-   For any new feature added, unit tests must be provided, following the example of the ones already created.

In order to start contributing:

1.  Fork this repository clicking on the "Fork" button on the upper-right area of the page.
2.  Clone your just forked repository:

```bash
git clone https://github.com/your-github-username/lightweightm2m-iotagent.git
```

3.  Add the main lightweightm2m-iotagent repository as a remote to your forked repository (use any name for your remote
    repository, it does not have to be lightweightm2m-iotagent, although we will use it in the next steps):

```bash
git remote add lightweightm2m-iotagent https://github.com/telefonicaid/lightweightm2m-iotagent.git
```

Before starting contributing, remember to synchronize the `master` branch in your forked repository with the `master`
branch in the main lightweightm2m-iotagent repository, by following this steps

1.  Change to your local `master` branch (in case you are not in it already):

```bash
  git checkout master
```

2.  Fetch the remote changes:

```bash
  git fetch lightweightm2m-iotagent
```

3.  Merge them:

```bash
  git rebase lightweightm2m-iotagent/master
```

Contributions following this guidelines will be added to the `master` branch, and released in the next version. The
release process is explained in the _Releasing_ section below.

#### Branching model

In order to start developing a new feature or refactoring, a new branch should be created with name `task/<taskName>`.
This branch must be created from the current version of the `master` branch. Once the new functionality has been
completed, a Pull Request will be created from the feature branch to `master`. Remember to check both the linters and
the tests before creating the Pull Request.

Bugfixes work the same way as other tasks, with the exception of the branch name, that should be called `bug/<bugName>`.

In order to contribute to the repository, these same scheme should be replicated in the forked repositories, so the new
features or fixes should all come from the current version of `master` and end up in `master` again.

All the `task/*` and `bug/*` branches are temporary, and should be removed once they have been merged.

There is another set of branches called `release/<versionNumber>`, one for each version of the product. This branches
point to each of the released versions of the project, they are permanent and they are created with each release.

#### Change log

The project contains a version changelog, called CHANGES_NEXT_RELEASE, that can be found in the root of the project.
Whenever a new feature or bug fix is going to be merged with `master`, a new entry should be added to this changelog.
The new entry should contain the reference number of the issue it is solving (if any).

When a new version is released, the change log is cleared, and remains fixed in the last commit of that version. The
content of the change log is also moved to the release description in the GitHub release.

#### Releasing

The process of making a release consists of the following steps:

1.  Create a new task branch changing the development version number in the package.json (with a suffix `-next`), to the
    new target version (without any suffix), and PR into `master`.
2.  Create a tag from the last version of `master` named with the version number and push it to the repository.
3.  Create the release in Github, from the created tag. In the description, add the contents of the change log.
4.  Create a release branch from the last version of `master` named with the version number.
5.  Create a new task for preparing the next release, adding the suffix `-next` to the current version number (to signal
    this as the development version).

## Project Testing

### Prerequisites

Its important to remark that this component's tests are end-to-end tests, that have some software requirements to be
run. This requirements are the following:

-   An instance of MongoDB running in `localhost`.
-   An instance of Orion Context Broker running in the location configured in `testConfig.js` (defaults to the alias
    `oriondb`). This instance has to have the 1026 and 27017 open for connections coming from the tests.

### Project build

The project is managed using npm.

For a list of available task, type

```bash
npm run
```

The following sections show the available options in detail.

### Start

Runs a local version of the IoT Agent

```bash
# Use git-bash on Windows
npm start
```

### Testing

[Mocha](https://mochajs.org/) Test Runner + [Should.js](https://shouldjs.github.io/) Assertion Library.

The test environment is preconfigured to run BDD testing style.

Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire)

To run tests, type

```bash
npm test
```

### Coding guidelines

ESLint

Uses the provided `.eslintrc.json` flag files. To check source code style, type

```bash
npm run lint
```

### Documentation guidelines

remark

To check consistency of the Markdown markup, type

```bash
npm run lint:md
```

textlint

Uses the provided `.textlintrc` flag file. To check for spelling and grammar errors, dead links and keyword consistency,
type

```bash
npm run lint:text
```

### Continuous testing

Support for continuous testing by modifying a src file or a test. For continuous testing, type

```bash
npm run test:watch
```

If you want to continuously check also source code style, use instead:

```bash
npm run watch
```

### Code Coverage

Istanbul

Analyzes the code coverage of your tests.

To generate an HTML coverage report under `site/coverage/` and to print out a summary, type

```bash
# Use git-bash on Windows
npm run test:coverage
```

### Clean

Removes `node_modules` and `coverage` folders, and `package-lock.json` file so that a fresh copy of the project is
restored.

```bash
# Use git-bash on Windows
npm run clean
```

### Prettify Code

Runs the [prettier](https://prettier.io) code formatter to ensure consistent code style (whitespaces, parameter
placement and breakup of long lines etc.) within the codebase. Uses the `prettierrc.json` flag file. The codebase also
offers an `.editorconfig` to maintain consistent coding styles across multiple IDEs.

```bash
# Use git-bash on Windows
npm run prettier
```

To ensure consistent Markdown formatting run the following:

```bash
# Use git-bash on Windows
npm run prettier:text
```
