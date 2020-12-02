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

  setContext(context) {
    this.context = context
    return this
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
  // Operadores Artimeticos
  '+': 'PLUS',
  '-': 'MINUS',
  '*': 'MUL',
  '/': 'DIV',
  '^': 'POW',
  '=': 'ASSIGN',
  '(': 'LPAREN',
  ')': 'RPAREN',
  // Operadores Logicos
  '<': 'LT',
  '>': 'GT',
  '==': 'EE',
  '!=': 'NE',
  '<=': 'LTE',
  '>=': 'GTE',
  '&&': 'AND',
  '!': 'NOT',
  '||': 'OR',
  // Data types
  'identifier': 'IDENTIFIER',
  'int': 'INT',
  'float': 'FLOAT',
  'string': 'STRING',
  'id': 'ID',
  'eof': 'EOF',
  '': '',
}
const KEYWORDS = [
  'const',
  'let',
  'var',
  'if',
  'then',
  'elif',
  'else',
  'do',
  'while',
  'for',
]
const OPERATORS = [
  '+',
  '-',
  '*',
  '/',
  '^',
  '=',
  '(',
  ')',
]

const LOGICAL = [
  '=',
  '!',
  '<',
  '>',
  '&',
  '|',
]


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

  matches(type, value) {
    return this.type === type && this.value === value;
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
      } else if(LOGICAL.includes(this.current)) {
        // Analiza Palabras Clave.
        this.tokens.push(this.makeLogical())
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

    while (this.current != null && (CHARSET).includes(this.current) && this.current != ' ' && !OPERATORS.includes(this.current)) {
      word += this.current
      this.advance()
    }
    if(KEYWORDS.includes(word)) return new Token('KEYWORD', word, position)
    return new Token(TT.identifier, word, position)
  }

  makeLogical() {
    let result = '';
    let position = this.position.current()

    while (this.current != null && LOGICAL.includes(this.current)) {
      result += this.current
      this.advance()
    }

    if(TT[result]) return new Token(TT[result], result, position)

    this.result.error = true;
    this.result.tokens = new Error(position, 'Mal Formato', result)
  }
}

/////////////////////////////////////////////
///// RUNTIME RESULT ////////////////////////
/////////////////////////////////////////////
class RuntimeResult {
  constructor() {
    this.value = null;
    this.error = null;
  }

  register(res) {
    if(res.error) this.error = res.error
    return res.value
  }

  success(value) {
    this.value = value
    return this
  }

  failure(error) {
    this.error = error
    return this
  }
}
/////////////////////////////////////////////
///// VALUES ////////////////////////////////
/////////////////////////////////////////////
class Number {
  constructor(value) {
    this.value = +value
    this.setPosition()
    this.setContext()
  }

  setPosition(position = null) {
    this.position = position
    return this
  }

  setContext(context = null) {
    this.context = context
    return this
  }
  
  addedTo(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value + other.value).setContext(this.context), err: null}
    }
  }

  subtractedBy(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value - other.value).setContext(this.context), err: null}
    }
  }

  multipliedBy(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value * other.value).setContext(this.context), err: null}
    }
  }

  dividedBy(other) {
    if(other instanceof Number) {
      if(other.value === 0) {
        return {res: null, err: new Error(this.position, 'Division entre cero', other.value).setContext(this.context)}
      }
      return {res: new Number(this.value / other.value).setContext(this.context), err: null}
    }
  }

  powedBy(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value ** other.value).setContext(this.context), err: null}
    }
  }

  ee(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value == other.value).setContext(this.context), err: null}
    }
  }
  
  ne(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value != other.value).setContext(this.context), err: null}
    }
  }
  
  lt(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value < other.value).setContext(this.context), err: null}
    }
  }

  gt(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value > other.value).setContext(this.context), err: null}
    }
  }

  lte(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value <= other.value).setContext(this.context), err: null}
    }
  }

  gte(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value >= other.value).setContext(this.context), err: null}
    }
  }

  and(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value && other.value).setContext(this.context), err: null}
    }
  }

  or(other) {
    if(other instanceof Number) {
      return {res: new Number(this.value || other.value).setContext(this.context), err: null}
    }
  }

  not() {
    return {res: new Number(this.value == 1 ? 0 : 1).setContext(this.context), err: null}
  }

  isTrue() {
    return this.value != 0
  }

  rep() {
    return `${this.value}`
  }
}

/////////////////////////////////////////////
///// NODES /////////////////////////////////
/////////////////////////////////////////////
class NumberNode {
  constructor(token) {
    this.token = token
    this.position = token.position
  }
   
  type() {
    return 'NumberNode'
  }

  rep() {
    return `${this.token.value}`
  }
}

class VarAccessNode {
  constructor(varNameToken) {
    this.varNameToken = varNameToken
    this.position = this.varNameToken.position
  }

  type() {
    return 'VarAccessNode'
  }

  rep() {
    return `${this.varNameToken.value}`
  }
}

class VarAssignNode {
  constructor(varNameToken, valueNode) {
    this.varNameToken = varNameToken
    this.valueNode = valueNode
    this.position = this.varNameToken.position
  }

  type() {
    return 'VarAssignNode'
  }

  rep() {
    return `(${this.varNameToken.rep()}, ASSIGN, ${this.valueNode.rep()})`
  }
}

class OperationNode {
  constructor(token) {
    this.token = token
  }
   
  type() {
    return 'OperationNode'
  }

  rep() {
    return `${this.token}`
  }
}

class BinaryOperationNode {
  constructor(leftNode, operationNode, rightNode) {
    this.leftNode = leftNode
    this.operationNode = new OperationNode(operationNode)
    this.rightNode = rightNode
    this.position = leftNode.position
  }
  
  type() {
    return 'BinaryOperationNode'
  }

  rep() {
    return `(${this.leftNode.rep()}, ${this.operationNode.rep()}, ${this.rightNode.rep()})`
  }
}

class UnaryOperationNode {
  constructor(operatorToken, node) {
    this.operatorToken = operatorToken
    this.node = node
    this.position = operatorToken.position

  }
  
  type() {
    return 'UnaryOperationNode'
  }
  rep() {
    return `(${this.operatorToken.type}, ${this.node.token ? this.node.token.value : this.node.rep()})`
  }
}

class IfNode {
  constructor(cases, elseCase) {
    this.cases = cases
    this.elseCase = elseCase
    this.position = cases[0].position
  }

  type() {
    return 'IfNode'
  }
  rep() {
    return '(IF)'
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

  /////////////////////////
  // REGLAS GRAMATICALES //
  /////////////////////////

  ifExpr = () => {
    this.res = new ParseResult()
    let cases = []
    let elseCase = null

    if(!this.currentToken.matches('KEYWORD', 'if')) {
      return this.res.failure(new Error(this.currentToken.position, '"if" esperado', this.currentToken.value))
    }

    this.res.registerAdvancement()
    this.advance()

    let condition = this.res.register(this.expression())
    if(this.res.error) return this.res

    if(!this.currentToken.matches('KEYWORD', 'then')) {
      return this.res.failure(new Error(this.currentToken.position, '"then" esperado', this.currentToken.value))
    }

    this.res.registerAdvancement()
    this.advance()

    let expression = this.res.register(this.expression())
    if(this.res.error) return this.res
    cases.push([condition, expression])

    while (this.currentToken.matches('KEYWORD', 'elif')) {
      this.res.registerAdvancement()
      this.advance()

      condition = this.res.register(this.expression())
      if(this.res.error) return this.res

      if(!this.currentToken.matches('KEYWORD', 'then')) {
        return this.res.failure(new Error(this.currentToken.position, '"then" esperado', this.currentToken.value))
      }

      this.res.registerAdvancement()
      this.advance()

      let expression = this.res.register(this.expression())
      if(this.res.error) return this.res
      cases.push([condition, expression])
    }

    if(this.currentToken.matches('KEYWORD', 'else')) {
      this.res.registerAdvancement()
      this.advance()

      elseCase = this.res.register(this.expression())
      if(this.res.error) return this.res
    }

    return this.res.success(new IfNode(cases, elseCase))
  }

  atom = () => {
    this.res = new ParseResult()
    let token = this.currentToken
    
    if([TT.int, TT.float].includes(token.type)) {
      this.res.registerAdvancement()
      this.advance()
      return this.res.success(new NumberNode(token))

    } else if(token.type == TT.identifier) {
      this.res.registerAdvancement()
      this.advance()
      return this.res.success(new VarAccessNode(token))
 
    } else if (token.type === TT['(']) {
      this.res.registerAdvancement()
      this.advance()
      let expression = this.res.register(this.expression())
      if (this.res.error) {
        return this.res
    
      } else if(this.currentToken.type == TT[')']) {
        this.res.registerAdvancement()
        this.advance()
        return this.res.success(expression)
      
      } else {
        return this.res.failure(new Error(this.currentToken.position, 'Cierre de Parentesis Esperado', this.currentToken.value))
      }      
    } else if(token.matches('KEYWORD', 'if')) {
      let ifExpr = this.res.register(this.ifExpr())
      if(this.res.error) return this.res
      return this.res.success(ifExpr)
    }

    return this.res.failure(new Error(token.position, 'INT, FLOAT, IDENTIFIER, "+", "-", o "(" Esperado', token.value))

  }

  power = () => {
    return this.binaryOperation(this.atom, [TT['^'], ], this.factor)
  }
 
  factor = () => {
    // Update Parser to start a ParseResult for each method
    this.res = new ParseResult()
    let token = this.currentToken

    if([TT['+'], TT['-']].includes(token.type)) {
      this.res.registerAdvancement()
      this.advance()
      let factor = this.res.register(this.factor())
      if(this.res.error) {
        return this.res
      } else {
        return this.res.success(new UnaryOperationNode(token, factor))
      }
    }

    // Not INT or FLOAT
    return this.power()

  }

  term = () => {
    return this.binaryOperation(this.factor, [TT['*'], TT['/']])
  }
  
  arithExpr = () => {
    return this.binaryOperation(this.term, [TT['+'], TT['-']])
  }

  compExpr = () => {
    this.res = new ParseResult()

    if(this.currentToken.type == TT['!']) {
      let operationToken = this.currentToken
      this.res.registerAdvancement()
      this.advance()

      let node = this.res.register(this.compExpr())
      if(this.res.error) return this.res
      return this.res.success(new UnaryOperationNode(operationToken, node))
    }

    let node = this.res.register(this.binaryOperation(this.arithExpr, [TT['=='], TT['!='], TT['<'], TT['>'], TT['>='], TT['<=']]))

    if (this.res.error) {
      return this.res.failure(new Error(this.currentToken.position, 'INT, FLOAT, IDENTIFIER, "+", "-", "(", "!" Esperado', this.currentToken.value))
    }
    return this.res.success(node)

    
  }

  expression = () => {
    this.res = new ParseResult()
    if(this.currentToken.matches('KEYWORD', 'var')) {
      this.res.registerAdvancement()
      this.advance()
      
      if(this.currentToken.type != TT.identifier) {
        return this.res.failure(new Error(this.currentToken.position, 'IDENTIFIER Esperado', this.currentToken.value))
      }
      let varName = this.currentToken
      this.res.registerAdvancement()
      this.advance()

      if(this.currentToken.type != TT['=']) {
        return this.res.failure(new Error(this.currentToken.position, '"=" Esperado', this.currentToken.value))
      }

      this.res.registerAdvancement()
      this.advance()
      let expression = this.res.register(this.expression())
      if(this.res.error) return this.res
      return this.res.success(new VarAssignNode(varName, expression))
    }

    let node = this.res.register(this.binaryOperation(this.compExpr, [TT['&&'], TT['||']]))

    if(this.res.error) return this.res.failure(new Error(this.currentToken.position, '"VAR", "+", "-", o "(" Esperado', this.currentToken.value))

    return this.res.success(node)
  }

  binaryOperation = (func_a, ops, func_b = null) => {
    if(func_b === null) {
      func_b = func_a
    }
    this.res = new ParseResult()
    let left = this.res.register(func_a())
    if(this.res.error) return this.res

    while (ops.includes(this.currentToken.type) || ops.includes(this.currentToken.type, this.currentToken.value)) {
      let operatorToken = this.currentToken.type
      this.res.registerAdvancement()
      this.advance()
      let right = this.res.register(func_b()) 
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
    this.advanceCount = 0
  }

  registerAdvancement() {
    this.advanceCount = this.advanceCount + 1
  }

  register(res) {
    this.advanceCount = this.advanceCount + res.advanceCount
    if(res.error) {
      this.error = res.error
    } else {
      return res
    }
  }

  success(node) {
    // Node fix
    node.failure = this.failure
    this.node = node
    return this.node
  }

  failure(error) {
    if(!this.error || this.advanceCount != 0) {
      this.error = error
    }
    return this
  }
}

/////////////////////////////////////////////
///// CONTEXT ///////////////////////////////
/////////////////////////////////////////////
class Context {
  constructor(displayName, parent=null, parentEntryPosition=null) {
    this.displayName = displayName
    this.parent = parent
    this.parentEntryPosition = parentEntryPosition
    this.symbolTable = null
  }
}

/////////////////////////////////////////////
///// SYMBOL TABLE //////////////////////////
/////////////////////////////////////////////
class SymbolTable {
  constructor() {
    this.symbols = {}
    this.parent = null
  }

  get(name) {
    let value = this.symbols[name]
    if(!value && this.parent) {
      return this.parent.get(name)
    }
    return value
  }

  set(name, value) {
    this.symbols[name] = value
  }

  remove(name) {
    delete this.symbols[name]
  }
}

/////////////////////////////////////////////
///// INTERPRETER ///////////////////////////
/////////////////////////////////////////////
class Interpreter {
  constructor() {
    this.node = null;
    this.visitList = {
      NumberNode: (node, ctx) => {
        let number = new Number(node.token.value)
        number.setPosition(node.token.position)
        number.setContext(ctx)
        return new RuntimeResult().success(number)
      },
      BinaryOperationNode: (node, ctx) => {
        let res = new RuntimeResult()
        let err;

        let left = res.register(this.visit(node.leftNode, ctx))
        if(res.error) return res

        let right = res.register(this.visit(node.rightNode, ctx))
        if(res.error) return res

        let result;
        let error;

        if(node.operationNode.token === TT['+']) {
          const {res, err} = left.addedTo(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['-']) {
          const {res, err} = left.subtractedBy(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['*']) {
          const {res, err} = left.multipliedBy(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['/']) {
          const {res, err} = left.dividedBy(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['^']) {
          const {res, err} = left.powedBy(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['==']) {
          const {res, err} = left.ee(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['!=']) {
          const {res, err} = left.ne(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['<']) {
          const {res, err} = left.lt(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['>']) {
          const {res, err} = left.gt(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['<=']) {
          const {res, err} = left.lte(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['>=']) {
          const {res, err} = left.gte(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['&&']) {
          const {res, err} = left.and(right)
          result = res;
          error = err;
        }
        if(node.operationNode.token === TT['||']) {
          const {res, err} = left.or(right)
          result = res;
          error = err;
        }

        if(error) {
          return res.failure(error)
        } else {
          result.setPosition(node.position)
          return res.success(result);
        }
      },
      UnaryOperationNode: (node, ctx) => {
        let res = new RuntimeResult()
        let err;
        let number = res.register(this.visit(node.node, ctx))
        if(res.error) return res

        err = null;

        if(node.operatorToken.type === TT['-']) {
          number = number.multipliedBy(new Number(-1))
        }

        if(node.operatorToken.type === TT['!']) {
          number = number.not()
        }

        if(err) {
          return res.failure(err)
        } else { 
          number.setPosition(node.position);
          return res.success(number);
        }
      },
      VarAccessNode: (node, ctx) => {
        let res = new RuntimeResult()
        let varName = node.varNameToken.value
        let value = ctx.symbolTable.get(varName)

        if(!value) {
          return res.failure(new Error(node.varNameToken.position, `${varName} no está definida`, node.varNameToken.value).setContext(ctx))
        }

        return res.success(value)
        
      },
      VarAssignNode: (node, ctx) => {
        let res = new RuntimeResult()
        let varName = node.varNameToken.value
        let value = res.register(this.visit(node.valueNode, ctx))

        if(res.error) return res
        ctx.symbolTable.set(varName, value)
        return res.success(value)

      },
      IfNode: (node, ctx) => {
        let res = new RuntimeResult()

        console.log(node.cases)
        console.log(node)

        for(let i = 0; i < node.cases.length; i++) {
          const condition = node.cases[i][0];
          const expression = node.cases[i][1];
          let conditionValue = res.register(this.visit(condition, ctx))
          if(res.error) return res
          
          if(conditionValue.isTrue()) {
            let exprValue = res.register(this.visit(expression, ctx))
            if(res.error) return res
            return res.success(exprValue)
          }

          if(node.elseCase) {
            let elseValue = res.register(this.visit(node.elseCase, ctx))
            if(res.error) return res
            return res.success(elseValue)
          }

          return res.success(null)
        }


      },
    }
  }

  visit(node, ctx) {
    if(this.visitList[node.type()]) {
      return this.visitList[node.type()](node, ctx)
    } else {
      console.log(`Metodo ${node.type()} no definido.`)
    }
    // Visit Binary Operator
    // colocar tipos a los nodos
  }

}


/////////////////////////////////////////////
///// RUN ///////////////////////////////////
/////////////////////////////////////////////

let globalSymbolTable = new SymbolTable()
globalSymbolTable.set('null', new Number(0))
globalSymbolTable.set('true', new Number(1))
globalSymbolTable.set('false', new Number(0))
function run(text, payload) {
  // Reset Output
  output.innerHTML = ''

  // Generates Tokens
  let lexer = new Lexer(text)
  let lexerResult = lexer.makeTokens()
  
  if (lexerResult.error) {
    showLexerError()
    return
  }
  if(payload === 'lexer') {
    showLexerResult()
    return
  }

  // Generates Abstraction Tree
  let parser = new Parser(lexerResult.tokens)
  let parserResult = parser.parse()

  if (parserResult.error) {
    showParserError()
    return
  }
  if(payload === 'parser') {
    showParserResult()
    return
  }

  let interpreter = new Interpreter()
  let ctx = new Context('&lt;programa&gt;')
  ctx.symbolTable = globalSymbolTable
  interpreterResult = interpreter.visit(parserResult, ctx)

  if (interpreterResult.error) {
    showInterpreterError()
    return
  }
  if(payload === 'interpreter') {
    showInterpreterResult()
    return
  }

  function showLexerError() {
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

  function showLexerResult() {
    const outputDOM = document.createElement('div')
    outputDOM.classList.add('tokens')
    let html = '';
    lexerResult.tokens.forEach(token => {
      html += `<p>${token.type}</p><p>${token.value}</p>`
    })
    outputDOM.innerHTML = html
    output.appendChild(outputDOM);
    output.innerHTML += '<div class="msg">Correcto Análisis Léxico</div>'
  }

  function showParserError() {
    const outputDOM = document.createElement('div')
    outputDOM.classList.add('tokens')
    let html = '';
    html += `<p>Error: ${parserResult.error.errorName}</p><p>Detalles: ${parserResult.error.details}</p>`
    html += `<p>Linea: ${parserResult.error.position.line}</p><p>Columna: ${parserResult.error.position.col++}</p>`
    html += `<p>Indice: ${parserResult.error.position.index}</p>`
    outputDOM.innerHTML = html
    output.appendChild(outputDOM);
    output.innerHTML += '<div class="msg">Incorrecto Análisis Sintáctico</div>'
  }

  function showParserResult() {
    output.innerHTML = parserResult.rep()
    output.innerHTML += '<div class="msg">Correcto Análisis Sintáctico</div>'
  }

  function showInterpreterError() {
    const outputDOM = document.createElement('div')
    outputDOM.classList.add('tokens')
    let html = '';
    html += `<p>Error: ${interpreterResult.error.errorName}</p><p>Detalles: ${interpreterResult.error.details}</p>`
    html += `<p>Linea: ${interpreterResult.error.position.line}</p><p>Columna: ${interpreterResult.error.position.col++}</p>`
    html += `<p>Indice: ${interpreterResult.error.position.index}</p><p>Contexto: ${interpreterResult.error.context.displayName}</p>`
    outputDOM.innerHTML = html
    output.appendChild(outputDOM);
    output.innerHTML += '<div class="msg">Incorrecto Análisis Semántico</div>'
  }

  function showInterpreterResult() {
    const outputDOM = document.createElement('div')
    outputDOM.classList.add('tokens')
    let html = '';
    html += `<p>Resultado</p><p>${interpreterResult.value ? interpreterResult.value.value : '&lt;null&gt;'}</p>`
    outputDOM.innerHTML = html
    output.appendChild(outputDOM);
    output.innerHTML += '<div class="msg">Correcto Análisis Semántico</div>'
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
// const btnBorrar = document.getElementById('borrar')
// btnBorrar.addEventListener('click', () => input.value = '')
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

form.addEventListener('submit', (e) => e.preventDefault())

document.onkeydown = function() {    
  switch (event.keyCode) { 
      case 116 : // F5 button
          event.returnValue = false;
          event.keyCode = 0;
          run(input.value, btnLexer.id); 
          return false; 
      case 117 : // F6 button
          event.returnValue = false;
          event.keyCode = 0;
          run(input.value, btnParser.id); 
          return false; 
      case 118 : // F7 button
          event.returnValue = false;
          event.keyCode = 0;
          run(input.value, btnInterpreter.id); 
          return false; 
      case 82 : //R button
          if (event.ctrlKey) { 
              event.returnValue = false; 
              event.keyCode = 0;  
              return false; 
          } 
  }
}

// Posibles Test Demos
// 
// 1. var a = var b = var c = 10
// 2. var a = 2 + 8 == 5 + 5
// 3. var a = 1 == 1 && 2 == 2