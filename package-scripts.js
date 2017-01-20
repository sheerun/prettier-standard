/* eslint max-len:[2, 120] */
module.exports = {
  scripts: {
    commit: {
      description: 'This uses commitizen to help us generate well formatted commit messages',
      script: 'git-cz',
    },
    test: {
      default: `nps --parallel test.unit,test.cli`,
      unit: {
        script: 'jest --coverage',
        description: 'Run the unit tests',
        watch: 'jest --watch',
      },
      cli: {
        script: 'jest --config=cli-test/jest.config.json',
        description: 'The E2E tests for the full CLI',
        watch: 'nps test.cli --watch',
      },
    },
    build: {
      description: 'delete the dist directory and run babel to build the files',
      script: 'rimraf dist && babel --copy-files --out-dir dist --ignore *.test.js,__mocks__ src',
    },
    lint: {description: 'lint the entire project', script: 'eslint .'},
    format: {
      description: 'Uses dist/index.js to format the project (formatting itself). Recommended to run the build first!',
      script: './dist/index.js src/**/*.js cli-test/tests/index.js __mocks__/*.js package-scripts.js --write',
    },
    reportCoverage: {
      description: 'Report coverage stats to codecov. This should be run after the `test` script',
      script: 'codecov',
    },
    release: {
      description: 'We automate releases with semantic-release. This should only be run on travis',
      script: 'semantic-release pre && npm publish && semantic-release post',
    },
    validate: {
      description: 'This runs several scripts to make sure things look good before committing or on clean install',
      script: 'nps build && nps format && nps --parallel lint,test',
    },
    addContributor: {
      description: 'When new people contribute to the project, run this',
      script: 'all-contributors add',
    },
    generateContributors: {
      description: 'Update the badge and contributors table',
      script: 'all-contributors generate',
    },
  },
  options: {silent: false},
}
