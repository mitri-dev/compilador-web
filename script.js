/////////////////////////////////////////////
///// POSITION //////////////////////////////
/////////////////////////////////////////////
class Position {
  constructor(index, line, col) {
    this.index = index
    this.line = line
    this.col = col
  }

  advance(current) {
    this.index++
    this.col++

    if(current === '\n') {
      this.line++
      this.col = 0
    }
  }

  current() {
    return {index: this.index, line: this.line, col: this.col}
  }
}

/////////////////////////////////////////////
///// ERRORS ////////////////////////////////
/////////////////////////////////////////////
class Error {
  constructor(position, errorName, details) {
    this.position = position
    this.errorName = errorName
    this.details = details
  }

  asString() {
    let result = `${this.errorName}: ${this.details}\nLinea ${this.position.line + 1}\nColumna ${this.position.col}\nIndex ${this.position.index}`
    return result
  }
}


/////////////////////////////////////////////
///// CONSTANTS /////////////////////////////
/////////////////////////////////////////////
const SKIP = ' \t\n'
const STRINGSYMBOL = "'"
const DIGITS = '0123456789'
const LETTERS = 'abcdefghijklmnñopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZ'
const CHARSET = []

for (let i = 32; i < 256; i++) {
  CHARSET.push(String.fromCharCode(i))
}

const TT = {
  '+': 'PLUS',
  '-': 'MINUS',
  '*': 'MUL',
  '/': 'DIV',
  '=': 'ASSIGN',
  '(': 'LPAREN',
  ')': 'RPAREN',
  'int': 'INT',
  'float': 'FLOAT',
  'string': 'STRING',
  'id': 'ID',
  '': '',
}
const KEYWORDS = {
  'const': true,
  'let': true,
  'if': true,
  'do': true,
  'while': true,
  'for': true,
}


/////////////////////////////////////////////
///// TOKENS ////////////////////////////////
/////////////////////////////////////////////
class Token {
  constructor(type, value = null, position) {
    this.type = type;
    this.value = value;
    this.position = position
  }

  representation() {
    if(this.value) return `${this.type}:${this.value}`
    return this.value
  }
}

/////////////////////////////////////////////
///// LEXER /////////////////////////////////
/////////////////////////////////////////////
class Lexer {
  constructor(text) {
    this.text = text;
    this.position = new Position(-1, 0, -1);
    this.current = null;
    this.tokens = []
    this.error = false
    this.result = {tokens: this.tokens, error: this.error}
    this.advance()
  }

  advance() {
    this.position.advance(this.current)
    this.position.index < this.text.length ? this.current = this.text[this.position.index] : this.current = null
  }

  makeTokens() {
    while (this.current != null && !this.result.error) {
      if (SKIP.includes(this.current)) {
        // Omite los Espacios, Tabulaciones y Saltos de Linea.
        this.advance()
      } else if(DIGITS.includes(this.current)) {
        // Analiza numeros Enteros o Flotantes.
        this.tokens.push(this.makeNumber())
      } else if(STRINGSYMBOL.includes(this.current)) {
        // Analiza Cadenas de Caracteres.
        this.tokens.push(this.makeString())
      } else if(LETTERS.includes(this.current)) {
        // Analiza Palabras Clave.
        this.tokens.push(this.makeKeyword())
      } else if(TT[this.current]) {
        // Analiza si el caracter esta dentro de los conocidos.
        this.tokens.push(new Token(TT[this.current], this.current, this.position.current()))
        this.advance()
      } else {
        // Manda un error.
        this.result.error = true;
        this.result.tokens = new Error(this.position,'Caracter Ilegal', this.current)
      }
    }
    return this.result
  }

  makeNumber() {
    let numberString = ''
    let dotCount = 0
    let position = this.position.current()

    while (this.current != null && (DIGITS + '.').includes(this.current)) {
      if(this.current === '.') {
        if(dotCount === 1) break
        dotCount++
        numberString += '.'
        this.advance()
      } else {
        numberString += this.current
        this.advance()
      }
    }

    if (dotCount == 0) {
      return new Token(TT.int, numberString, position)
    } else {
      return new Token(TT.float, numberString, position)
    }
  }
  
  makeString() {
    let string = ''
    let symbolCount = 0
    let position = this.position.current()
    
    while (this.current != null && CHARSET.includes(this.current)) {
      if(this.current === STRINGSYMBOL) symbolCount++
      string += this.current
      this.advance()
      if(symbolCount === 2){
        return new Token(TT.string, string, position)
      }
    }
    this.result.error = true;
    this.result.tokens = new Error(position, 'Mal Formato', string)
  }

  makeKeyword() {
    let word = '';
    let position = this.position.current()

    while (this.current != null && (LETTERS).includes(this.current)) {
      word += this.current
      this.advance()
    }
    if(KEYWORDS[word]) return new Token(word.toUpperCase(), word, position)
    return new Token('WORD', word, position)
  }
}

/////////////////////////////////////////////
///// NODES /////////////////////////////////
/////////////////////////////////////////////
class NumberNode {
  constructor(token) {
    this.token = token
  }
}

class BinaryOperationNode {
  constructor(leftNode, operationNode, rightNode) {
    this.leftNode = leftNode
    this.operationNode = operationNode
    this.rightNode = rightNode
  }
}

/////////////////////////////////////////////
///// PARSER ////////////////////////////////
/////////////////////////////////////////////
class Parser {
  constructor(tokensList) {
    this.tokens = tokensList
    this.index = -1
    this.currentToken = null
    this.func
    this.advance()
  }

  advance() {
    this.index++
    if(this.index < this.tokens.length) this.currentToken = this.tokens[this.index]
    return this.currentToken
  }

  parse = () => {
    let res = this.expression()
    return res
  }

  factor = () => {
    let token = this.currentToken
    if([TT.int, TT.float].includes(token.type)) {
      this.advance()
      return new NumberNode(token)
    }
  }

  term = () => {
    return this.binaryOperation(this.factor, [TT['*'], TT['/']])
  }

  expression = () => {
    return this.binaryOperation(this.term, [TT['+'], TT['-']])
  }

  binaryOperation = (func, ops) => {
    let left = func()

    while (ops.includes(this.currentToken.type)) {
      let operatorToken = this.currentToken.type
      this.advance()
      let right = func()      
      left = new BinaryOperationNode(left, operatorToken, right)
    }
    return left
  }
}

/////////////////////////////////////////////
///// RUN ///////////////////////////////////
/////////////////////////////////////////////
function run(text, payload) {
  // Generates Tokens
  let lexer = new Lexer(text)
  let lexerResult = lexer.makeTokens()

  // Generates Abstraction Tree
  let parser = new Parser(lexerResult.tokens)
  let parserResult = parser.parse()
  console.log(parserResult)


  // Payloads
  output.innerHTML = ''
  if(payload === 'lexer') {
    if(!lexerResult.error) {
      const tokensDOM = document.createElement('div')
      tokensDOM.classList.add('tokens')
      let html = '';
      lexerResult.tokens.forEach(token => {
        html += `<p>${token.type}</p><p>${token.value}</p>`
      })
      tokensDOM.innerHTML = html
      output.appendChild(tokensDOM);
      output.innerHTML += '<div class="msg">Correcto Análisis Léxico</div>'
    } else {
      const tokensDOM = document.createElement('div')
      tokensDOM.classList.add('tokens')
      let html = '';
      html += `<p>Error: ${lexerResult.tokens.errorName}</p><p>Detalles: ${lexerResult.tokens.details}</p>`
      html += `<p>Linea: ${lexerResult.tokens.position.line}</p><p>Columna: ${lexerResult.tokens.position.col++}</p>`
      html += `<p>Indice: ${lexerResult.tokens.position.index}</p>`
      tokensDOM.innerHTML = html
      output.appendChild(tokensDOM);
      output.innerHTML += '<div class="msg">Incorrecto Análisis Léxico</div>'
    }
  }

  if(payload === 'parser') {
    if(!lexerResult.error) {
      output.innerHTML = JSON.stringify(parserResult)
    }
  }
}

/////////////////////////////////////////////
///// WEB ///////////////////////////////////
/////////////////////////////////////////////
// Elements
const input = document.getElementById('input')
const form = document.getElementById('form')
const output = document.getElementById('output')
const btnLexer = document.getElementById('lexer')
const btnParser = document.getElementById('parser')
const btnBorrar = document.getElementById('borrar')
let keys = []

// Listeners
window.addEventListener('keyup', () => keys = [])
window.addEventListener('keydown', (e) => {
  keys.push(e.keyCode)
  if(keys.includes(13) && keys.includes(17)) {
    run(input.value)
  }
})

btnLexer.addEventListener('click', () => run(input.value, btnLexer.id))
btnParser.addEventListener('click', () => run(input.value, btnParser.id))
btnBorrar.addEventListener('click', () => input.value = '')

form.addEventListener('submit', (e) => e.preventDefault())

// Functions
function test() {

}
