## To create a migration:

1. Create a new file inside versions specifiying the would-be version of SNJS that would result when publishing your migration. For example, if the current SNJS version is 1.0.0 in package.json, your migration version should be 1.0.1 to target users below this version.

2. **Important** Export your migration inside the index.ts file.
