#!/usr/bin/env node
var resolve = require('url').resolve
var pathJoin = require('path').join
var fs = require('fs')
var prompt = require('sync-prompt').prompt
var program = require('nomnom')
var dateFormat = require('iso8601').fromDate

program.script('issuer')

program.command('init')
  .callback(function () {
    issuerCmd()
    classCmd()
  })
  .help('Issuer and class information')
  
program.command('add')
  .callback(addCmd)
  .help('Issue a badge to a person')
  
program.command('issuer')
  .callback(issuerCmd)
  .help('Create issuer information (issuer.json)')
  
program.command('class')
  .callback(classCmd)
  .help('Create class information (class.json)')

program.parse()

// Commands

function addCmd() {
  var issuer = tryRead('issuer.json')
  var badge = tryRead('class.json')
  
  // Determine the ID of the most recently issued badge
  var files = fs.readdirSync('./')  
  var maxId = files.reduce(function (acc, file) {
    if(!file.match(/\d+\.json/)) return acc
    var number = parseInt(file)
    return number > acc ? number : acc
  }, 0)
    
  var receiver = {}
  console.log('Information for the receiver of the badge')
  // how to determine the id?
  receiver.uid = maxId + 1
  console.log('Reiceiver ID ' + receiver.uid)
  receiver.recipient = {
    type: 'email',
    hashed: false
  }
  receiver.recipient.identity = prompt('Email? ')
  receiver.issuedOn = dateFormat(new Date())
  receiver.badge = resolve(issuer.url, 'class.json')
  receiver.verify = {
    type: 'hosted'
  }
  receiver.verify.url = resolve(issuer.url,  receiver.uid + '.json')
  
  writeJSON(receiver.uid, receiver)
}

function issuerCmd() {
  var issuer = {}
  // issuer.json
  console.log('Issuer information:')
  issuer.name = prompt('Name? ')
  issuer.url = prompt('Root url? ')
  
  writeJSON('issuer', issuer)
}

function classCmd() {
  var issuer = tryRead('issuer.json')
  
  // class.json
  var badgeClass = {}
  console.log('Badge class information:')
  badgeClass.name = prompt('Name? ')
  badgeClass.description = prompt('Description? ')
  // assuming badge.png as an image for now
  badgeClass.image = resolve(issuer.url, 'badge.png')
  console.log('Image: ' + badgeClass.image)

  // the criteria should also be  created by the tool
  // maybe it should ask for a file or create it
  var criteria = prompt('Criteria? ' + issuer.url)
  badgeClass.criteria = resolve(issuer.url, criteria)

  badgeClass.issuer = resolve(issuer.url, 'issuer.json')
  console.log('Issuer: ' + badgeClass.issuer)  
  
  writeJSON('class', badgeClass)
}

// Helper
function tryRead(file) {
  var fullFile = pathJoin(process.cwd(), file)
  if(fs.existsSync(fullFile)) {
    return require(fullFile)
  } else {
    console.log('No ' + file + ' found. First add this to your directory')
    process.exit()
  }
}

function writeJSON(name, json) {
  console.log('Writing ' + name + '.json...')
  fs.writeFileSync('./' + name + '.json', JSON.stringify(json, null, '  '))
  console.log('Done.')
}