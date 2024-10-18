# Galaxy

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/ETH-PEACH-Lab/datascience-visualisation.git/HEAD)

Show a random NASA Astronomy Picture of the Day in a JupyterLab panel.

## Requirements

- JupyterLab >= 4.0.0

## Installation

To install the extension, execute:

```bash
pip install cluster_viz
```

## Uninstallation

To remove the extension, execute:

```bash
pip uninstall cluster_viz
```

## Development Setup

To set up the development environment, follow these steps:

### 1. Create the Conda Environment

Run the following command to create a new environment with JupyterLab 4, Node.js, Git, Copier, and other required packages:

```bash
conda create -n galaxy --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=4 nodejs=20 git copier=9 jinja2-time
```

### 2. Activate the Environment

Activate the Conda environment:

```bash
conda activate galaxy
```

### 3. Install the Extension in Development Mode

Install the package with `pip` in editable mode:

```bash
pip install -ve .
```

### 4. Install Node.js Dependencies

Run the following command to install JavaScript dependencies:

```bash
jlpm install
```

### 5. Watch for Changes

Start the watch process to automatically rebuild the extension when source files are modified:

```bash
jlpm watch
```

### 6. Run JupyterLab

In a separate terminal, activate the conda environment and run JupyterLab:

```bash
jupyter lab
```

With `jlpm watch` running in one terminal and JupyterLab in another, every saved change will automatically rebuild the extension. Refresh JupyterLab to load the updated extension in the browser.

## Packaging

For instructions on how to package and release the extension, refer to the [RELEASE](RELEASE.md) file.

For instructions on how to deploy the extension, refer to the [DEPLOYMENT](DEPLOYMENT.md) file.

## Project Structure

```
datascience-visualisation/
│
├── src          # Frontend logic
└── backend      # Backend logic
```
