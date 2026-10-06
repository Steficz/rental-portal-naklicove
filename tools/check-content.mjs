#!/usr/bin/env node

// Simple content checker for markdown files
import fs from 'fs'
import path from 'path'

const CONTENT_DIR = './content'

function parseYamlFrontmatter(content) {
  const frontmatterRegex = /^---\s*[\s\S]*?---\s*/
  const match = content.match(frontmatterRegex)
  
  if (!match) return { frontmatter: {}, rawContent: content }
  
  const frontmatterStr = match[0].replace(/^---\s*$/, '').trim()
  
  // Simple YAML parser for basic frontmatter keys
  const lines = frontmatterStr.split('\n')
  const frontmatter = {}
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':', 2)
      frontmatter[key.trim()] = value.trim().replace(/^['"](.*)['"]$/, '$1')
    }
  }
  
  const rawContent = content.slice(match[0].length)
  return { frontmatter, rawContent }
}

function validateMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if it has frontmatter
    const { frontmatter } = parseYamlFrontmatter(content)
    
    // Check for required keys in frontmatter
    if (filePath.includes('content/legal/')) {
      // Legal files might not have all keys, but should at least parse
    }
    
    // Check for internal links to legal files
    const linkRegex = /\[.*\]\(([^)]+)\)/g
    let match
    
    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[1]
      
      // Check if it's an internal legal link
      if (linkPath.startsWith('/legal/')) {
        // Check if the file exists
        const legalFilePath = path.join('./content', linkPath.substring(1))
        if (!fs.existsSync(legalFilePath)) {
          console.error(`ERROR: Broken link in ${filePath}: ${linkPath} -> File not found`)
          return false
        }
      }
    }
    
    return true
  } catch (error) {
    console.error(`ERROR: Failed to read file ${filePath}:`, error.message)
    return false
  }
}

function checkContent() {
  let allValid = true
  
  function walkDir(dir) {
    try {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          walkDir(fullPath)
        } else if (item.endsWith('.md')) {
          const isValid = validateMarkdownFile(fullPath)
          if (!isValid) allValid = false
        }
      }
    } catch (error) {
      console.error(`ERROR: Failed to walk directory ${dir}:`, error.message)
    }
  }
  
  walkDir(CONTENT_DIR)
  
  if (!allValid) {
    process.exit(1)
  }
  
  console.log('✅ All content files are valid')
}

checkContent()