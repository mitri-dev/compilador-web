/////////////////////////////////////////////
///// POSITION //////////////////////////////
/////////////////////////////////////////////
class Position {
  constructor(index, line, col) {
    this.index = index
    this.line = line
    this.col = col
  }

  advance(current = null) {
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
  'eof': 'EOF',
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

  rep() {
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
    this.tokens.push(new Token(TT.eof, 'eof', this.position.current()))
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
   
  rep() {
    return `${this.token.value}`
  }
}

class BinaryOperationNode {
  constructor(leftNode, operationNode, rightNode) {
    this.leftNode = leftNode
    this.operationNode = operationNode
    this.rightNode = rightNode
  }
  
  rep() {
    return `(${this.leftNode.rep()}, ${this.operationNode}, ${this.rightNode.rep()})`
  }
}

class UnaryOperationNode {
  constructor(operatorToken, node) {
    this.operatorToken = operatorToken
    this.node = node
  }

  rep() {
    return `(${this.operatorToken.type}, ${this.node.token.value})`
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
    this.res
    this.advance()
  }

  advance() {
    this.index++
    if(this.index < this.tokens.length) this.currentToken = this.tokens[this.index]
    return this.currentToken
  }

  parse = () => {
    this.res = this.expression()
    if(!this.res.error && this.currentToken.type != TT.eof) {
      return this.res.failure(new Error(this.currentToken.position, 'Error en Syntaxis', this.currentToken.value))
    }
    return this.res
  }

  factor = () => {
    // Update Parser to start a ParseResult for each method
    this.res = new ParseResult()
    let token = this.currentToken

    if([TT['+'], TT['-']].includes(token.type)) {
      this.res.register(this.advance())
      // This. or Let ??
      let factor = this.res.register(this.factor())
      if(this.res.error) {
        return this.res
      } else {
        return this.res.success(new UnaryOperationNode(token, factor))
      }

    } else if([TT.int, TT.float].includes(token.type)) {
      this.res.register(this.advance())
      return this.res.success(new NumberNode(token))

    } else if (token.type === TT['(']) {
      this.res.register(this.advance())
      let expression = this.res.register(this.expression())
      if (this.res.error) {
        return this.res
        
      } else if(this.currentToken.type == TT[')']) {
        this.res.register(this.advance())
        return this.res.success(expression)
      
      } else {
        return this.res.failure(new Error(this.currentToken.position, 'Cierre de Parentesis Esperado', this.currentToken.value))
      }
      
    }
    // Not INT or FLOAT
    console.log(token)
    return this.res.failure(new Error(token.position, 'INT o FLOAT Esperado', token.value))

  }

  term = () => {
    return this.binaryOperation(this.factor, [TT['*'], TT['/']])
  }

  expression = () => {
    return this.binaryOperation(this.term, [TT['+'], TT['-']])
  }

  binaryOperation = (func, ops) => {
    this.res = new ParseResult()
    let left = this.res.register(func())
    if(this.res.error) return this.res

    while (ops.includes(this.currentToken.type)) {
      let operatorToken = this.currentToken.type
      this.res.register(this.advance())
      let right = this.res.register(func()) 
      if(this.res.error) return this.res  
      left = new BinaryOperationNode(left, operatorToken, right)
    }
    return this.res.success(left)
  }
}

/////////////////////////////////////////////
///// PARSE RESULT ///////////////////////////
/////////////////////////////////////////////
class ParseResult {
  constructor(error = null, node = null) {
    this.error = error
    this.node = node
    this.rep;
  }

  register(res) {
    // Checks if "res" is a ParseResult, checks
    // for an error and adds it to self and returns
    // a Node. Else it will return the res
    if(res instanceof ParseResult) {
      if(res.error) {
        this.error = res.error
        return res.node
      }
    }

    return res
  }

  success(node) {
    // Node fix
    node.failure = this.failure
    this.node = node
    return this.node
  }

  failure(error) {
    this.error = error
    return this
  }
}

/////////////////////////////////////////////
///// INTERPRETER ///////////////////////////
/////////////////////////////////////////////
class Interpreter {
  constructor() {
    this.msg = 'hola'
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
  let parserResult;
  let interpreterResult;
  if(!lexerResult.error) {
    let parser = new Parser(lexerResult.tokens)
    parserResult = parser.parse()
    console.log(parserResult)

    if(!parserResult.error) {
      let interpreter = new Interpreter(parserResult)
      console.log(interpreter)
    }
  }


  // Payloads
  output.innerHTML = ''
  if(payload === 'lexer') {
    if(!lexerResult.error) {
      const outputDOM = document.createElement('div')
      outputDOM.classList.add('tokens')
      let html = '';
      lexerResult.tokens.forEach(token => {
        html += `<p>${token.type}</p><p>${token.value}</p>`
      })
      outputDOM.innerHTML = html
      output.appendChild(outputDOM);
      output.innerHTML += '<div class="msg">Correcto Análisis Léxico</div>'
    } else {
      const outputDOM = document.createElement('div')
      outputDOM.classList.add('tokens')
      let html = '';
      html += `<p>Error: ${lexerResult.tokens.errorName}</p><p>Detalles: ${lexerResult.tokens.details}</p>`
      html += `<p>Linea: ${lexerResult.tokens.position.line}</p><p>Columna: ${lexerResult.tokens.position.col++}</p>`
      html += `<p>Indice: ${lexerResult.tokens.position.index}</p>`
      outputDOM.innerHTML = html
      output.appendChild(outputDOM);
      output.innerHTML += '<div class="msg">Incorrecto Análisis Léxico</div>'
    }
  }

  if(payload === 'parser') {
    if(parserResult.error) {
      const outputDOM = document.createElement('div')
      outputDOM.classList.add('tokens')
      let html = '';
      html += `<p>Error: ${parserResult.error.errorName}</p><p>Detalles: ${parserResult.error.details}</p>`
      html += `<p>Linea: ${parserResult.error.position.line}</p><p>Columna: ${parserResult.error.position.col++}</p>`
      html += `<p>Indice: ${parserResult.error.position.index}</p>`
      outputDOM.innerHTML = html
      output.appendChild(outputDOM);
      output.innerHTML += '<div class="msg">Incorrecto Análisis Sintáctico</div>'
    } else { 
      output.innerHTML = parserResult.rep()
      output.innerHTML += '<div class="msg">Correcto Análisis Sintáctico</div>'
    }
    
    
  }
  console.log(payload)
  if(payload === 'interpreter') {
    output.innerHTML = '<div class="msg">Correcto Análisis Semántico</div>'
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
const btnInterpreter = document.getElementById('interpreter')
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
btnInterpreter.addEventListener('click', () => run(input.value, btnInterpreter.id))
btnBorrar.addEventListener('click', () => input.value = '')

form.addEventListener('submit', (e) => e.preventDefault())

// Functions
function test() {

}
