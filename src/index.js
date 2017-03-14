#!/usr/bin/env node

import parser from './parser'
import formatFiles from './format-files'

const argv = parser.parse(process.argv.slice(2))
formatFiles(argv)
