# Scripts Directory

This directory contains organized utility scripts for the pharmacy scheduling system.

## Directory Structure

```
scripts/
├── data-processing/     # Data import, transformation, and processing
├── database/           # Database maintenance and optimization
├── deployment/         # Deployment automation and environment setup
└── utilities/          # General utility scripts and helper tools
```

## Available Scripts

### Data Processing
- `data-processing/import-complete-dataset.js` - Script for importing pharmacy data from Excel files

### Database
- `database/fix_pooler_encryption.sh` - Fix for Supabase pooler encryption issues

### Deployment
- (Future deployment automation scripts)

### Utilities  
- (General utility scripts and helper tools)

## Usage

Make sure to review and understand each script before running. Some scripts may require specific environment variables or database connections.

All scripts should be run from the project root directory unless otherwise specified:

```bash
# Import pharmacy data
node scripts/data-processing/import-complete-dataset.js

# Fix pooler encryption
bash scripts/database/fix_pooler_encryption.sh
```

## Development Guidelines

1. All scripts should be executable and well-documented
2. Include proper error handling and validation
3. Use environment variables for configuration
4. Follow language-specific best practices
5. Test scripts in development environment first
6. Organize scripts by purpose in appropriate subdirectories 