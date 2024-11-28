# steps for building: az devops release approval extension

 **Successfully Built the Extension on Windows 10: Steps and Notes**

1. Install Python 2
    - Add it to your system path.
    - Rename the executable to python2.exe.
1. Update Dependencies
    - Replace node-sass with sass in package.json, using version ^1.0.0.
    - Remove all caret symbols (^) for version constraints in package.json (except for sass ^1.0.0).
1. Prepare for Installation
    - Delete package-lock.json before running npm install.
    - Use Node.js 16: nvm use 16.
    - Remove existing packages: rd /s node_modules.
1. Install and Build
    - Install the packages: npm install.
    - Build the extension:
    - `npm run publish:dev --token PAT_TOKEN`

1. Locate the Built Extension
    - The extension will be in the out/ directory.
1. Additional Notes
    - Use Node.js 16 when building to avoid SSL issues.