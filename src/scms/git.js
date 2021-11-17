import { findUpSync } from 'find-up'
import { execaSync } from 'execa'
import path from 'path'
import parseDiff from '../parse-diff.js'

const SPECIAL_EMPTY_TREE_COMMIT_HASH =
  '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

function extractLineChangeData (output) {
  const result = []
  const diff = parseDiff(output)
  diff.forEach(d => {
    const additions = []
    d.chunks.forEach(chunk => {
      if (chunk.newLines > 0) {
        additions.push({
          start: chunk.newStart - 1,
          end: chunk.newStart + chunk.newLines - 2
        })
      }
    })
    additions.sort((a, b) => a.start - b.start)
    if (d.to !== '/dev/null') {
      result.push({
        filepath: d.to,
        changes: additions
      })
    }
  })
  return result
}

class Git {
  constructor (dir, cwd) {
    this.cwd = cwd
    this.dir = dir
  }

  name () {
    return 'git'
  }

  runGit (args) {
    return execaSync('git', args, { cwd: this.cwd }).stdout.trim()
  }

  getRevision (branch) {
    try {
      const revision = this.runGit(['merge-base', 'HEAD', branch || 'HEAD'])
      return this.runGit(['rev-parse', '--short', revision])
    } catch (error) {
      if (error.stderr) {
        if (
          error.stderr.includes(`Needed a single revision`) ||
          error.stderr === 'fatal: Not a valid object name HEAD'
        ) {
          return SPECIAL_EMPTY_TREE_COMMIT_HASH
        }
      }

      return undefined
    }
  }

  getChanges (revision, patterns) {
    const output = this.runGit(
      ['diff-index', '--unified=0', '-p', revision].concat(patterns || [])
    )

    return extractLineChangeData(output)
  }
}

export default cwd => {
  const gitDirectory = findUpSync('.git', { cwd, type: 'directory' })

  if (gitDirectory) {
    return new Git(path.dirname(gitDirectory), cwd)
  }
}
