# Git TimeSheet

This project is a simple tool to outline what you have worked using git as the source of information.


## How to use

```bash
git-timesheet --start-date 2024-01-01 --end-date 2024-01-31
git-timesheet --window 1d 
git-timesheet --window 1w 
git-timesheet --window 1m 
git-timesheet --window 1y
```

These command will generate you a report of what you have worked on in the given time periods.


The report will include the following information:

- Datetime of commit
- Repo of commit
- Target dir of commit
- Branch of commit
- Commit message
- First commit time of the day
- Last commit time of the day
- Total commit time spent each day
- Total commit time spent in the given time period


This project should be created using typescript and will be built using the following libraries:
- `commander` for the cli interface
- `@types/bun` for the bun types
- `bun` for the bun runtime


The architecture should be as follows:
- `git-timesheet-cli` is the cli library will define the command line interface and call the core library.
- `git-timesheet-core` is the core library defines the logic of the project and will call the vcs & reporter libraries
- `git-timesheet-vcs` is the vcs library that will be used to get the git information.
    - users will be able to define their own vcs library by implementing the `Vcs` interface.
- `git-timesheet-reporter` is the reporter service that will be used to generate the report.
    - users will be able to define their own reporter service by implementing the `Reporter` interface.


The project should be built with the following structure:
- `packages/cli` will contain the cli library
- `packages/core` will contain the core library
- `packages/vcs` will contain the vcs library
- `packages/reporter` will contain the reporter service
- `packages/types` will contain the types of the project
- `packages/utils` will contain the utils of the project










