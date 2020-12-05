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

  copy() {
    return new Position(this.index, this.line, this.col)
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
const SKIP = ' \t'
const STRINGSYMBOL = '"'
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
  // Funciones
  ',': 'COMMMA',
  '=>': 'ARROW',
  // Listas
  '[': 'LSQUARE',
  ']': 'RSQUARE',
  // Lineas
  '⁋': 'NEWLINE',
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
  'CONST',
  'LET',
  'VAR',
  'IF',
  'THEN',
  'ELIF',
  'ELSE',
  'FOR',
  'TO',
  'STEP',
  'WHILE',
  'DO',
  'FUNCTION',
  'END',
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
  '[',
  ']',
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
    
    this.position.copy = () => {
      return new Position(this.position.index, this.position.line, this.position.col)
    }
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
        // Omite los Espacios, Tabulaciones.
        this.advance()
      } else if(this.current == '\n') {
        // Analiza numeros Enteros o Flotantes.
        this.tokens.push(this.makeNewLine())
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
    let escapeCharacter = false
    let position = this.position.current()
    this.advance()
    
    while (this.current != null && this.current != STRINGSYMBOL || escapeCharacter) {
      if(escapeCharacter) {
        string += this.current
      } else {
        if(this.current == '\\') {
          escapeCharacter = true
        } else {
          string += this.current
        }
      }
      this.advance()
      escapeCharacter = false
    }
    this.advance()
    return new Token(TT.string, string, position) 
  }

  makeKeyword() {
    let word = '';
    let position = this.position.current()

    while (this.current != null && (CHARSET).includes(this.current) && this.current != ' ' && !OPERATORS.includes(this.current) && this.current != ',') {
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

  makeNewLine() {
    this.advance()
    return new Token(TT['⁋'], '⁋', this.position.current())
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
class NumberType {
  constructor(value) {
    this.value = parseFloat(value)
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
    if(other instanceof NumberType) {
      return {res: new NumberType(this.value + other.value).setContext(this.context), err: null}
    }
  }

  subtractedBy(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(this.value - other.value).setContext(this.context), err: null}
    }
  }

  multipliedBy(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(this.value * other.value).setContext(this.context), err: null}
    }
  }

  dividedBy(other) {
    if(other instanceof NumberType) {
      if(other.value === 0) {
        return {res: null, err: new Error(this.position, 'Division entre cero', other.value).setContext(this.context)}
      }
      return {res: new NumberType(this.value / other.value).setContext(this.context), err: null}
    }
  }

  powedBy(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(this.value ** other.value).setContext(this.context), err: null}
    }
  }

  ee(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value == other.value)).setContext(this.context), err: null}
    }
  }
  
  ne(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value != other.value)).setContext(this.context), err: null}
    }
  }
  
  lt(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value < other.value)).setContext(this.context), err: null}
    }
  }

  gt(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value > other.value)).setContext(this.context), err: null}
    }
  }

  lte(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value <= other.value)).setContext(this.context), err: null}
    }
  }

  gte(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value >= other.value)).setContext(this.context), err: null}
    }
  }

  and(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value && other.value)).setContext(this.context), err: null}
    }
  }

  or(other) {
    if(other instanceof NumberType) {
      return {res: new NumberType(+(this.value || other.value)).setContext(this.context), err: null}
    }
  }

  not() {
    return {res: new NumberType(this.value == 1 ? 0 : 1).setContext(this.context), err: null}
  }

  isTrue() {
    return this.value != 0
  }

  copy() {
    let copy = new NumberType(this.value)
    copy.setPosition(this.position)
    copy.setContext(this.context)
    return copy
  }

  rep() {
    return `${this.value}`
  }
}

class StringType {
  constructor(value) {
    this.value = value
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
    if(other instanceof StringType) {
      return {res: new StringType(this.value + other.value).setContext(this.context), err: null}
    }
  }

  ee(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value == other.value)).setContext(this.context), err: null}
    }
  }
  
  ne(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value != other.value)).setContext(this.context), err: null}
    }
  }
  
  lt(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value < other.value)).setContext(this.context), err: null}
    }
  }

  gt(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value > other.value)).setContext(this.context), err: null}
    }
  }

  lte(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value <= other.value)).setContext(this.context), err: null}
    }
  }

  gte(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value >= other.value)).setContext(this.context), err: null}
    }
  }

  and(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value && other.value)).setContext(this.context), err: null}
    }
  }

  or(other) {
    if(other instanceof StringType) {
      return {res: new NumberType(+(this.value || other.value)).setContext(this.context), err: null}
    }
  }

  not() {
    return {res: new StringType(this.value == 1 ? 0 : 1).setContext(this.context), err: null}
  }

  isTrue() {
    return this.value.length > 0
  }

  copy() {
    let copy = new StringType(this.value)
    copy.setPosition(this.position)
    copy.setContext(this.context)
    return copy
  }

  rep() {
    return `${this.value}`
  }
}

class ListType {
  constructor(elements) {
    this.elements = elements
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
    let newList = this.copy()
    newList.elements.push(other)
    return {res: newList, err: null}
  }

  subtractedBy(other) {
    if(other instanceof NumberType) {
      let newList = this.copy()
      try {
        newList.elements.splice(other.value,1)
        return {res: newList, err: null}
      } catch (error) {
        return {res: null, err: new Error(this.position, 'Elemento en este indice fuera de los limites', other.value).setContext(this.context)}
      }
    }
  }

  dividedBy(other) {
    if(other instanceof NumberType) {

      if(other.value >= this.elements.length || other.value < 0) {
        return {res: null, err: new Error(this.position, 'Elemento en este indice fuera de los limites', other.value).setContext(this.context)}
      } else {
        return {res: this.elements[other.value], err: null}
      }
    }
  }

  copy() {
    let copy = new ListType(this.elements)
    copy.setPosition(this.position)
    copy.setContext(this.context)
    return copy
  }

  rep(list) {
    let result = []
    for (let i = 0; i < this.elements.length; i++) {
      if(this.elements[i].value || this.elements[i].value == 0) {
        result.push(this.elements[i].value)
      } else if(this.elements[i].elements) {
        result.push(this.elements[i].rep(true))
      }
    }
    if(list) {
      return `[${result.toString()}]`
    } else {
      return `${result.join('<br>')}`

    }
  }
}

class BaseFunctionType {
  constructor(name) {
    this.name = name || '&lt;anonimo&gt;'
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

  generateNewContext() {
    let newContext = new Context(this.name, this.context, this.position)
    newContext.symbolTable = new SymbolTable(newContext.parent.symbolTable)
    return newContext
  }

  checkArgs(argNames, args) {
    let res = new RuntimeResult()
    if(args.length > argNames.length) {
      return res.failure(new Error(this.position, 'Muchos argumentos introducidos', this.name).setContext(this.context))
    }

    if(args.length < argNames.length) {
      return res.failure(new Error(this.position, 'Pocos argumentos introducidos', this.name).setContext(this.context))
    }

    return res.success(null)
  }

  populateArgs(argNames, args, execCtx) {
    for (let i = 0; i < args.length; i++) {
      let argValue = args[i];
      let argName = argNames[i];

      argValue.setContext(execCtx)
      execCtx.symbolTable.set(argName, argValue)
    }
  }

  checkAndPopulateArgs(argNames, args, execCtx) {
    let res = new RuntimeResult()
    res.register(this.checkArgs(argNames,args))
    if(res.error) return res
    this.populateArgs(argNames, args, execCtx)
    return res.success(null)
  }

}

class FunctionType extends BaseFunctionType {
  constructor(name, bodyNode, argNames, returnNull) {
    super(name)
    this.bodyNode = bodyNode
    this.argNames = argNames
    this.returnNull = returnNull
  }

  setPosition(position = null) {
    this.position = position
    return this
  }

  setContext(context = null) {
    this.context = context
    return this
  }

  execute(args) {
    let res = new RuntimeResult()
    let interpreter = new Interpreter()
    let execCtx = this.generateNewContext()

    res.register(this.checkAndPopulateArgs(this.argNames, args, execCtx))
    if(res.error) return res

    let value = interpreter.visit(this.bodyNode, execCtx).value
    if(res.error) return res
    if(this.returnNull) {
      let returnValueFix = value.elements[0]
      return res.success(returnValueFix)
      // return res.success(value)
      // return res.success(new NumberType(0))
    } else {
      return res.success(value)
    }
  }

  copy() {
    let copy = new FunctionType(this.name, this.bodyNode, this.argNames, this.returnNull)
    copy.setPosition(this.position)
    copy.setContext(this.context)
    return copy
  }

  rep() {
    return `&lt;function&gt; ${this.name}`
  }
}

class BuiltInFunction extends BaseFunctionType {
  constructor(name) {
    super(name)
    this.methodList = {
      print: {
        argNames: ['value'],
        exec: (execCtx) => {
          return new RuntimeResult().success(execCtx.symbolTable.get('value'))
        }
      },
      now: {
        argNames: [],
        exec: (execCtx) => {
          return new RuntimeResult().success(new StringType(new Date().toLocaleString()))
        }
      }, 
      nota: {
        argNames: [],
        exec: (execCtx) => {
          return new RuntimeResult().success(new StringType('20pts'))
        }
      },
      len: {
        argNames: ['array'],
        exec: (execCtx) => {
          return new RuntimeResult().success(new NumberType(execCtx.symbolTable.get('array').elements.length))
        }
      },
      integrantes: {
        argNames: [],
        exec: (execCtx) => {
          return new RuntimeResult().success(new StringType(`
          González Rubén 28.288.237<br>
          Martinez Wender 28.400.156<br>
          Mitri Jorge 27.137.766<br>
          Ramírez Juan 27.886.663<br>
          Rivas Carlos 28.470.187
          `))
        }
      } 
    }
  }

  execute(args) {
    let res = new RuntimeResult()
    let execCtx = this.generateNewContext()

    let methodName = this.name

    res.register(this.checkAndPopulateArgs(this.methodList[methodName].argNames, args, execCtx))
    if(res.error) return res
    
    let returnValue
    if(this.methodList[methodName]) {
       returnValue  = res.register(this.methodList[methodName].exec(execCtx))
    } else {
      return res.failure(new Error(this.position, `Funcion "${methodName}" no definida`, this.name).setContext(this.context))
    }

    return res.success(returnValue)
  }

  copy() {
    let copy = new BuiltInFunction(this.name)
    copy.setPosition(this.position)
    copy.setContext(this.context)
    return copy
  }

  rep() {
    return `&lt;built-in function&gt; ${this.name}`

  }
}


/////////////////////////////////////////////
///// NODES /////////////////////////////////
/////////////////////////////////////////////
class StringNode {
  constructor(token) {
    this.token = token
    this.position = token.position
  }
   
  type() {
    return 'StringNode'
  }

  rep() {
    return `${this.token.type}`
  }
}

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

class ListNode {
  constructor(elementNodes, position) {
    this.elementNodes = elementNodes
    this.position = position
  }
   
  type() {
    return 'ListNode'
  }

  rep() {
    let result = []
    for (let i = 0; i < this.elementNodes.length; i++) {
      result.push(this.elementNodes[i].rep())
    }
    return `[${result.toString()}]`
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

class ForNode {
  constructor(varNameToken, startNode, endNode, stepNode = null, bodyNode, returnNull) {
    this.varNameToken = varNameToken
    this.startNode = startNode
    this.endNode = endNode
    this.stepNode = stepNode
    this.bodyNode = bodyNode
    this.returnNull = returnNull

    this.position = this.varNameToken.position
  }

  type() {
    return 'ForNode'
  }
  rep() {
    return '(FOR)'
  }
}

class WhileNode {
  constructor(conditionNode, bodyNode, returnNull) {
    this.conditionNode = conditionNode
    this.bodyNode = bodyNode
    this.returnNull = returnNull

    this.position = this.conditionNode.position
  }

  type() {
    return 'WhileNode'
  }
  rep() {
    return '(WHILE)'
  }
}

class FunctionDefinitionNode {
  constructor(varNameToken = null, argNameTokens, bodyNode, returnNull) {
    this.varNameToken = varNameToken
    this.argNameTokens = argNameTokens
    this.bodyNode = bodyNode
    this.returnNull = returnNull

    this.position = this.bodyNode.position
  }

  type() {
    return 'FunctionDefinitionNode'
  }
  rep() {
    return '(FuncDef)'
  }
}

class CallNode {
  constructor(nodeToCall, argNodes) {
    this.nodeToCall = nodeToCall
    this.argNodes = argNodes

    this.position = this.nodeToCall.position
  }

  type() {
    return 'CallNode'
  }
  rep() {
    return '(CallNode)'
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
    this.updateCurrentToken()
    return this.currentToken
  }

  reverse(amount = 1) {
    this.index = this.index - amount
    this.updateCurrentToken()
    return this.currentToken
  }

  updateCurrentToken() {
    if(this.index < this.tokens.length) this.currentToken = this.tokens[this.index]
  }

  parse = () => {
    let res = this.statements()
    if(!res.error && this.currentToken.type != TT.eof) {
      return res.failure(new Error(this.currentToken.position, 'Error en Syntaxis', this.currentToken.value))
    }
    return res
  }

  /////////////////////////
  // REGLAS GRAMATICALES //
  /////////////////////////

  statements = () => {
    let res = new ParseResult()
    let statements = [];
    let position = this.currentToken.position.copy()

    while (this.currentToken.type == TT['⁋']) {
      res.registerAdvancement()
      this.advance()
    }

    let statement = res.register(this.expression())
    if(res.error) return res
    statements.push(statement)

    let moreStatements = true

    while (true) {
      let nlCount = 0;
      while (this.currentToken.type == TT['⁋']) {
        res.registerAdvancement()
        this.advance()
        nlCount = nlCount + 1
      }
      if(nlCount == 0) {
        moreStatements = false
      }
      if(!moreStatements) break
      statement = res.tryRegister(this.expression())
      if(!statement) {
        this.reverse(res.toReverseCount)
        moreStatements = false
        continue
      }
      statements.push(statement)
    }
    return res.success(new ListNode(statements, position))
  }

  expression = () => {
    let res = new ParseResult()
    if(this.currentToken.matches('KEYWORD', 'VAR')) {
      res.registerAdvancement()
      this.advance()
      
      if(this.currentToken.type != TT.identifier) {
        return res.failure(new Error(this.currentToken.position, 'IDENTIFIER Esperado', this.currentToken.value))
      }
      let varName = this.currentToken
      res.registerAdvancement()
      this.advance()

      if(this.currentToken.type != TT['=']) {
        return res.failure(new Error(this.currentToken.position, '"=" Esperado', this.currentToken.value))
      }

      res.registerAdvancement()
      this.advance()
      let expression = res.register(this.expression())
      if(res.error) return res
      return res.success(new VarAssignNode(varName, expression))
    }

    let node = res.register(this.binaryOperation(this.compExpr, [TT['&&'], TT['||']]))

    if(res.error) return res.failure(new Error(this.currentToken.position, '"VAR", "+", "-", o "(" Esperado', this.currentToken.value))

    return res.success(node)
  }

  listExpr = () => {
    let res = new ParseResult()
    let elementNodes = []
    let position = this.currentToken.position

    if(this.currentToken.type != TT['[']) {
      return res.failure(new Error(this.currentToken.position, '"[" esperado', this.currentToken.value))
    }
    
    res.registerAdvancement()
    this.advance()

    if(this.currentToken.type == TT[']']) {
      res.registerAdvancement()
      this.advance()
    } else {
      elementNodes.push(res.register(this.expression()))

      if(res.error) {
        return res.failure(new Error(this.currentToken.position, '"]","VAR", "IF", "FOR", "WHILE", "FUNCTION", "+", "-", o "(" Esperado', this.currentToken.value))
      }

      while (this.currentToken.type == TT[',']) {
        res.registerAdvancement()
        this.advance()

        elementNodes.push(res.register(this.expression()))
        if(res.error) return res
      }

      if(this.currentToken.type != TT[']']) {
        return res.failure(new Error(this.currentToken.position, '"," o "]" Esperado', this.currentToken.value))
      }


      res.registerAdvancement()
      this.advance()

      if(this.currentToken.type == TT['=>']) {
        // console.log('Lista Completada con Flecha')
      }
    }
    // console.log('Lista Completada')
    return res.success(new ListNode(elementNodes, position))
  }

  ifExpr = () => {
    let res = new ParseResult()
    let allCases = res.register(this.ifExprCases('IF'))
    if(res.error) return res
    const cases = allCases[0]
    const elseCase = allCases[1]
    return res.success(new IfNode(cases, elseCase))
  }

  ifExprB = () => {
    return this.ifExprCases('ELIF')
  }

  ifExprC = () => {
    let res = new ParseResult()
    let elseCase = null

    if(this.currentToken.matches('KEYWORD', 'ELSE')) {
      res.registerAdvancement()
      this.advance()

      if(this.currentToken.type == TT['⁋']) {
        res.registerAdvancement()
        this.advance()

        let statements = res.register(this.statements())
        if(res.error) return res
        elseCase = [statements, true]

        if(this.currentToken.matches('KEYWORD', 'END')) {
          res.registerAdvancement()
          this.advance()
        } else {
          return res.failure(new Error(this.currentToken.position, `"END" esperado`, this.currentToken.value))
        }
      } else {
        let expression = res.register(this.expression())
        if(res.error) return res
        elseCase = [expression, false]
      }
    }
    return res.success(elseCase)
  }

  ifExprBorC = () => {
    let res = new ParseResult()
    let cases = []
    let elseCase = null
    let allCases;

    if(this.currentToken.matches('KEYWORD', 'ELIF')) {
      allCases = res.register(this.ifExprB())
      if(res.error) return res
      const newCases = allCases[0]
      const newElseCase = allCases[1]
      elseCase = newElseCase
      cases.concat(newCases)
    } else {
      elseCase = res.register(this.ifExprC())
      if(res.error) return res
    }
    return res.success([cases, elseCase])

  }

  ifExprCases = (caseKeyword) => {
    let res = new ParseResult()
    let cases = []
    let elseCase = null
    let allCases;

    if(!this.currentToken.matches('KEYWORD', caseKeyword)) {
      return res.failure(new Error(this.currentToken.position, `"${caseKeyword}" esperado`, this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    let condition = res.register(this.expression())
    if(res.error) return res

    if(!this.currentToken.matches('KEYWORD', 'THEN')) {
      return res.failure(new Error(this.currentToken.position, '"then" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()
    
    if(this.currentToken.type == TT['⁋']) {
      res.registerAdvancement()
      this.advance()

      let statements = res.register(this.statements())
      if(res.error) return res
      cases.push([condition, statements, true])
      if(this.currentToken.matches('KEYWORD', 'END')) {
        res.registerAdvancement()
        this.advance()
      } else {
        allCases = res.register(this.ifExprBorC())
        if(res.error) return res
        const newCases = allCases[0]
        const newElseCase = allCases[1]
        elseCase = newElseCase
        cases.concat(newCases)
      }
    } else {
      let expression = res.register(this.expression())
      if(res.error) return res
      cases.push([condition, expression, false])

      allCases = res.register(this.ifExprBorC())
      if(res.error) return res
      const newCases = allCases[0]
      const newElseCase = allCases[1]
      elseCase = newElseCase
      cases.concat(newCases)
    }
    return res.success([cases, elseCase])
  }

  call = () => {
    let res = new ParseResult()
    let atom = res.register(this.atom())
    if(res.error) return res

    if(this.currentToken.type == TT['(']) {
      res.registerAdvancement()
      this.advance()
      
      let argNodes = []

      if(this.currentToken.type == TT[')']) {
        res.registerAdvancement()
        this.advance()
      } else {
        argNodes.push(res.register(this.expression()))

        if(res.error) {
          return res.failure(new Error(this.currentToken.position, '")","VAR", "IF", "FOR", "WHILE", "FUNCTION", "+", "-", o "(" Esperado', this.currentToken.value))
        }

        while (this.currentToken.type == TT[',']) {
          res.registerAdvancement()
          this.advance()

          argNodes.push(res.register(this.expression()))
          if(res.error) return res
        }

        if(this.currentToken.type != TT[')']) {
          return res.failure(new Error(this.currentToken.position, '"," o ")" Esperado', this.currentToken.value))
        }

        res.registerAdvancement()
        this.advance()
      }
      return res.success(new CallNode(atom, argNodes))
    }
    return res.success(atom)
  }

  atom = () => {
    let res = new ParseResult()
    let token = this.currentToken
    
    if([TT.int, TT.float].includes(token.type)) {
      res.registerAdvancement()
      this.advance()
      return res.success(new NumberNode(token))
    }
    if(token.type == TT.string) {
      res.registerAdvancement()
      this.advance()
      return res.success(new StringNode(token))

    } else if(token.type == TT.identifier) {
      res.registerAdvancement()
      this.advance()
      return res.success(new VarAccessNode(token))
 
    } else if (token.type === TT['(']) {
      res.registerAdvancement()
      this.advance()
      let expression = res.register(this.expression())
      if (res.error) {
        return res
    
      } else if(this.currentToken.type == TT[')']) {
        res.registerAdvancement()
        this.advance()
        return res.success(expression)
      
      } else {
        return res.failure(new Error(this.currentToken.position, '")" Esperado', this.currentToken.value))
      }     

    } else if(token.type == TT['[']) {
      let listExpr = res.register(this.listExpr())
      if(res.error) return res
      return res.success(listExpr)

    } else if(token.matches('KEYWORD', 'IF')) {
      let ifExpr = res.register(this.ifExpr())
      if(res.error) return res
      return res.success(ifExpr)

    } else if(token.matches('KEYWORD', 'FOR')) {
      let forExpr = res.register(this.forExpr())
      if(res.error) return res
      return res.success(forExpr)

    } else if(token.matches('KEYWORD', 'WHILE')) {
      let whileExpr = res.register(this.whileExpr())
      if(res.error) return res
      return res.success(whileExpr)

    } else if(token.matches('KEYWORD', 'FUNCTION')) {
      let funcDef = res.register(this.funcDef())
      if(res.error) return res
      return res.success(funcDef)
    }

    return res.failure(new Error(token.position, 'INT, FLOAT, IDENTIFIER, "+", "-", o "(" Esperado', token.value))

  }

  power = () => {
    return this.binaryOperation(this.call, [TT['^'], ], this.factor)
  }
 
  factor = () => {
    // Update Parser to start a ParseResult for each method
    let res = new ParseResult()
    let token = this.currentToken

    if([TT['+'], TT['-']].includes(token.type)) {
      res.registerAdvancement()
      this.advance()
      let factor = res.register(this.factor())
      if(res.error) {
        return res
      } else {
        return res.success(new UnaryOperationNode(token, factor))
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
    let res = new ParseResult()

    if(this.currentToken.type == TT['!']) {
      let operationToken = this.currentToken
      res.registerAdvancement()
      this.advance()

      let node = res.register(this.compExpr())
      if(res.error) return res
      return res.success(new UnaryOperationNode(operationToken, node))
    }

    let node = res.register(this.binaryOperation(this.arithExpr, [TT['=='], TT['!='], TT['<'], TT['>'], TT['>='], TT['<=']]))

    if (res.error) {
      return res.failure(new Error(this.currentToken.position, 'INT, FLOAT, IDENTIFIER, "+", "-", "(", "!" Esperado', this.currentToken.value))
    }
    return res.success(node)
  }

  binaryOperation = (func_a, ops, func_b = null) => {
    if(func_b === null) {
      func_b = func_a
    }
    let res = new ParseResult()
    let left = res.register(func_a())
    if(res.error) return res

    while (ops.includes(this.currentToken.type) || ops.includes(this.currentToken.type, this.currentToken.value)) {
      let operatorToken = this.currentToken.type
      res.registerAdvancement()
      this.advance()
      let right = res.register(func_b()) 
      if(res.error) return res  
      left = new BinaryOperationNode(left, operatorToken, right)
    }
    return res.success(left)
  }

  forExpr = () => {
    let res = new ParseResult()

    if(!this.currentToken.matches('KEYWORD', 'FOR')) {
      return res.failure(new Error(this.currentToken.position, '"for" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    if(this.currentToken.type != TT.identifier) {
      return res.failure(new Error(this.currentToken.position, 'IDENTIFIER Esperado', this.currentToken.value))
    }

    let varName = this.currentToken
    res.registerAdvancement()
    this.advance()

    if(this.currentToken.type != TT['=']) {
      return res.failure(new Error(this.currentToken.position, '"=" Esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    let startValue = res.register(this.expression())
    if(res.error) return res
    
    if(!this.currentToken.matches('KEYWORD', 'TO')) {
      return res.failure(new Error(this.currentToken.position, '"to" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    let endValue = res.register(this.expression())
    if(res.error) return res

    let stepValue;
    if(this.currentToken.matches('KEYWORD', 'STEP')) {
      res.registerAdvancement()
      this.advance()

      stepValue = res.register(this.expression())
      if(res.error) return res
    } else {
      stepValue = null
    }

    if(!this.currentToken.matches('KEYWORD', 'THEN')) {
      return res.failure(new Error(this.currentToken.position, '"then" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    if(this.currentToken.type == TT['⁋']) {
      res.registerAdvancement()
      this.advance()

      let body = res.register(this.statements())
      if(res.error) return res

      if(!this.currentToken.matches('KEYWORD', 'END')) {
        return res.failure(new Error(this.currentToken.position, `"END" esperado`, this.currentToken.value))
      }

      res.registerAdvancement()
      this.advance()

      return res.success(new ForNode(varName, startValue, endValue, stepValue, body, true))
    }

    let body = res.register(this.expression())
    if(res.error) return res

    return res.success(new ForNode(varName, startValue, endValue, stepValue, body, false))
  }

  whileExpr = () => {
    let res = new ParseResult()

    if(!this.currentToken.matches('KEYWORD', 'WHILE')) {
      return res.failure(new Error(this.currentToken.position, '"while" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    let condition = res.register(this.expression())
    if(res.error) return res

    if(!this.currentToken.matches('KEYWORD', 'THEN')) {
      return res.failure(new Error(this.currentToken.position, '"then" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    if(this.currentToken.type == TT['⁋']) {
      res.registerAdvancement()
      this.advance()

      let body = res.register(this.statements())
      if(res.error) return res

      if(!this.currentToken.matches('KEYWORD', 'END')) {
        return res.failure(new Error(this.currentToken.position, `"END" esperado`, this.currentToken.value))
      }

      res.registerAdvancement()
      this.advance()

      return res.success(new WhileNode(condition, body, true))
    }


    let body = res.register(this.expression())
    if(res.error) return res

    return res.success(new WhileNode(condition, body, false))
  }

  funcDef = () => {
    let res = new ParseResult()
    
    if(!this.currentToken.matches('KEYWORD', 'FUNCTION')) {
      return res.failure(new Error(this.currentToken.position, '"function" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    let varNameToken
    if(this.currentToken.type == TT.identifier) {
      varNameToken = this.currentToken
      res.registerAdvancement()
      this.advance()
      if(this.currentToken.type != TT['(']) {
        return res.failure(new Error(this.currentToken.position, '"(" esperado', this.currentToken.value))
      }
    } else {
      varNameToken = null
      if(this.currentToken.type != TT['(']) {
        return res.failure(new Error(this.currentToken.position, '"(" o IDENTIFIER esperado', this.currentToken.value))
      }
    }

    res.registerAdvancement()
    this.advance()
    let argNameTokens = []

    if(this.currentToken.type == TT.identifier) {
      argNameTokens.push(this.currentToken)
      res.registerAdvancement()
      this.advance()
      while(this.currentToken.type == TT[',']) {
        res.registerAdvancement()
        this.advance()

        if(this.currentToken.type != TT.identifier) {
          return res.failure(new Error(this.currentToken.position, 'IDENTIFIER esperado', this.currentToken.value))
        }

        argNameTokens.push(this.currentToken)
        res.registerAdvancement()
        this.advance()
      }

      if(this.currentToken.type != TT[')']) {
        return res.failure(new Error(this.currentToken.position, '")" o "," esperado', this.currentToken.value))
      }
    } else {
      if(this.currentToken.type != TT[')']) {
        return res.failure(new Error(this.currentToken.position, '")" o IDENTIFIER esperado', this.currentToken.value))
      }
    }
    
    res.registerAdvancement()
    this.advance()

    if(this.currentToken.type == TT['=>']) {
      res.registerAdvancement()
      this.advance()
      
      let nodeToReturn = res.register(this.expression())
      if(res.error) return res

      return res.success(new FunctionDefinitionNode(varNameToken, argNameTokens, nodeToReturn, false))
    }

    if(this.currentToken.type != TT['⁋']) {
      return res.failure(new Error(this.currentToken.position, '"=>" o "⁋" esperado', this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    let body = res.register(this.statements())
    if(res.error) return res

    if(!this.currentToken.matches('KEYWORD', 'END')) {
      return res.failure(new Error(this.currentToken.position, `"END" esperado`, this.currentToken.value))
    }

    res.registerAdvancement()
    this.advance()

    return res.success(new FunctionDefinitionNode(varNameToken, argNameTokens, body, true))
  }
}

/////////////////////////////////////////////
///// PARSE RESULT ///////////////////////////
/////////////////////////////////////////////
class ParseResult {
  constructor(error = null, node = null) {
    this.error = error
    this.node = node
    this.lastRegisteredAdvanceCount = 0
    this.advanceCount = 0
    this.toReverseCount = 0
  }

  registerAdvancement() {
    this.lastRegisteredAdvanceCount = 1
    this.advanceCount = this.advanceCount + 1
  }

  register(res) {
    this.lastRegisteredAdvanceCount = res.advanceCount
    this.advanceCount = this.advanceCount + res.advanceCount
    if(res.error) {
      this.error = res.error
    } else {
      return res
    }
  }

  tryRegister(res) {
    if(res.error) {
      this.toReverseCount = res.advanceCount
      return null
    }
    return this.register(res)
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
  constructor(parent = null) {
    this.symbols = {}
    this.parent = parent
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
        let numberType = new NumberType(node.token.value)
        numberType.setPosition(node.token.position)
        numberType.setContext(ctx)
        return new RuntimeResult().success(numberType)
      },
      StringNode: (node, ctx) => {
        return new RuntimeResult().success(new StringType(node.token.value).setPosition(node.token.position).setContext(ctx))
      },
      ListNode: (node, ctx) => {
        let res = new RuntimeResult()

        let elements = []

        for (let i = 0; i < node.elementNodes.length; i++) {
          const e = node.elementNodes[i];
          elements.push(res.register(this.visit(e, ctx)))
          if(res.error) return res
        }
        
        return res.success(new ListType(elements).setContext(ctx).setPosition(node.position))
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

        let error = null;

        if(node.operatorToken.type === TT['-']) {
          const {res, err} = number.multipliedBy(new NumberType(-1))
          number = res;
          error = err;
        }

        if(node.operatorToken.type === TT['!']) {
          const {res, err} = number.not()
          number = res;
          error = err;
        }

        if(error) {
          return res.failure(error)
        } else { 
          number.setPosition(node.position);
          console.log(number)
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

        value = value.copy().setPosition(node.position).setContext(ctx)
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

        for(let i = 0; i < node.cases.length; i++) {
          const condition = node.cases[i][0];
          const expression = node.cases[i][1];
          const returnNull = node.cases[i][2];
          let conditionValue = res.register(this.visit(condition, ctx))
          if(res.error) return res
          
          if(conditionValue.isTrue()) {
            let exprValue = res.register(this.visit(expression, ctx))
            if(res.error) return res
            if(returnNull) {
              console.log(exprValue)
              let returnValueFix = {
                value: exprValue.rep(),
                position: exprValue.position,
                context: exprValue.context,
              }
              return res.success(returnValueFix)
              // return res.success(new NumberType(0))
            } { 
              console.log(exprValue)
              return res.success(exprValue)
            }
          }

          if(node.elseCase) {
            let expression = node.elseCase[0]
            let returnNull = node.elseCase[1]
            let elseValue = res.register(this.visit(expression, ctx))
            if(res.error) return res
            console.log(elseValue)
            if(returnNull) {
              console.log(elseValue)
              let returnValueFix = {
                value: elseValue.rep(),
                position: elseValue.position,
                context: elseValue.context,
              }
              return res.success(returnValueFix)
            } else {
              return res.success(elseValue)
            }
          }
          
          return res.success(new NumberType(0))
        }
      },
      ForNode: (node, ctx) => {
        let res = new RuntimeResult()
        let elements = []

        let startNode = res.register(this.visit(node.startNode, ctx))
        if(res.error) return res

        let endNode = res.register(this.visit(node.endNode, ctx))
        if(res.error) return res

        let stepNode;
        if(node.stepNode) {
          stepNode = res.register(this.visit(node.stepNode, ctx))
          if(res.error) return res
        } else {
          stepNode = new NumberType(1)
        }

        let i = startNode.value

        let condition
        if(startNode.value >= 0) {
          condition = () => {
            return i < endNode.value
          }
        } else {
          condition = () => {
            return i > endNode.value
          }
        }

        while (condition()) {
          ctx.symbolTable.set(node.varNameToken.value, new NumberType(i))
          i += stepNode.value

          elements.push(res.register(this.visit(node.bodyNode, ctx)))
          if(res.error) return res
        }
        if(node.returnNull) {
          let returnValueFix = []

          for (let i = 0; i < elements.length; i++) {
            returnValueFix.push(elements[i].elements[0])
          }
          
          console.log(returnValueFix)
          let listType = new ListType(returnValueFix).setContext(ctx).setPosition(node.position)
          return res.success(listType)
          // return res.success(new NumberType(0))
        } { 
          let listType = new ListType(elements).setContext(ctx).setPosition(node.position)
          console.log(elements)
          return res.success(listType)
        }
      },
      WhileNode: (node, ctx) => {
        let res = new RuntimeResult()
        let elements = []
        
        while (true) {
          let condition = res.register(this.visit(node.conditionNode, ctx))
          if(res.error) return res
          
          if(!condition.isTrue()) break
          
          elements.push(res.register(this.visit(node.bodyNode, ctx)))
          if(res.error) return res
        }

        if(node.returnNull) {
          let returnValueFix = []

          for (let i = 0; i < elements.length; i++) {
            returnValueFix.push(elements[i].elements[0])
          }
          
          return res.success(new ListType(returnValueFix).setContext(ctx).setPosition(node.position))
          // return res.success(new NumberType(0))
        } { 
          return res.success(new ListType(elements).setContext(ctx).setPosition(node.position))
        }
      },
      FunctionDefinitionNode: (node, ctx) => {
        let res = new RuntimeResult()

        let funcName = node.varNameToken ? node.varNameToken.value : null 
        let bodyNode = node.bodyNode
        let argNames = []

        for (const argName in node.argNameTokens) {
            argNames.push(node.argNameTokens[argName].value)
        }

        let funcValue = new FunctionType(funcName, bodyNode, argNames, node.returnNull).setContext(ctx).setPosition(node.position)

        if(node.varNameToken) {
          ctx.symbolTable.set(funcName, funcValue)
        }
        return res.success(funcValue)
      },
      CallNode: (node, ctx) => {
        let res = new RuntimeResult()
        let args = []

        let valueToCall = res.register(this.visit(node.nodeToCall, ctx))
        if(res.error) return res

        for (const argNode in node.argNodes) {
          args.push(res.register(this.visit(node.argNodes[argNode], ctx)))
         if(res.error) return res
        }

        let returnValue = res.register(valueToCall.execute(args))
        if(res.error) return res
        returnValue = returnValue.copy().setPosition(node.position).setContext(ctx)
        return res.success(returnValue)
      },
    }
  }

  visit(node, ctx) {
    if(this.visitList[node.type()]) {
      return this.visitList[node.type()](node, ctx)
    } else {
      console.log(`Metodo ${node.type()} no definido.`)
    }
  }

}


/////////////////////////////////////////////
///// RUN ///////////////////////////////////
/////////////////////////////////////////////

let globalSymbolTable = new SymbolTable()
globalSymbolTable.set('NULL', new NumberType(0))
globalSymbolTable.set('TRUE', new NumberType(1))
globalSymbolTable.set('FALSE', new NumberType(0))
globalSymbolTable.set('PRINT', new BuiltInFunction('print'))
globalSymbolTable.set('NOW', new BuiltInFunction('now'))
globalSymbolTable.set('NOTA', new BuiltInFunction('nota'))
globalSymbolTable.set('LEN', new BuiltInFunction('len'))
globalSymbolTable.set('INTEGRANTES', new BuiltInFunction('integrantes'))
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
    if(lexerResult.tokens.length <= 1) {
      playSound('parser-2')
      output.innerHTML = '&lt;empty&gt;'
      output.innerHTML += '<div class="msg">Correcto Análisis Léxico</div>'
      return
    }
    showLexerResult()
    return
  }

  // Generates Abstraction Tree
  let parser = new Parser(lexerResult.tokens)
  let parserResult = parser.parse()

  if (parserResult.error) {
    if(lexerResult.tokens.length <= 1 && payload == 'parser') {
      playSound('parser-1')
      output.innerHTML = '&lt;empty&gt;'
      output.innerHTML += '<div class="msg">Correcto Análisis Sintáctico</div>'
      return
    } else if (lexerResult.tokens.length <= 1 && payload == 'interpreter') {
      playSound('interpreter-1')
      output.innerHTML = '&lt;empty&gt;'
      output.innerHTML += '<div class="msg">Correcto Análisis Semántico</div>'
      return
    }
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
    playSound('error')
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
    playSound('parser-2')
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
    playSound('error')
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
    playSound('parser-1')
    output.innerHTML = parserResult.rep()
    output.innerHTML += '<div class="msg">Correcto Análisis Sintáctico</div>'
  }

  function showInterpreterError() {
    playSound('error')
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
    playSound('interpreter-1')
    console.log(interpreterResult)
    if(interpreterResult.value.elements[0].argNames) {
      const outputDOM = document.createElement('div')
      outputDOM.classList.add('tokens')
      let html = '';
      html += `<p>Resultado</p><p>Funcion "${interpreterResult.value.elements[0].name}" definida<br>${interpreterResult.value.rep()}</p>`
      outputDOM.innerHTML = html
      output.appendChild(outputDOM);
      output.innerHTML += '<div class="msg">Correcto Análisis Semántico</div>'
      return

    }

    if(interpreterResult.value.elements) {
      const outputDOM = document.createElement('div')
      outputDOM.classList.add('tokens')
      let html = '';
      html += `<p>Resultado</p><p>${interpreterResult.value.rep()}</p>`
      outputDOM.innerHTML = html
      output.appendChild(outputDOM);
      output.innerHTML += '<div class="msg">Correcto Análisis Semántico</div>'
      return
    }
    let value = '&lt;null&gt;'
    if(interpreterResult.value) {
      value = interpreterResult.value.value
    }
    const outputDOM = document.createElement('div')
    outputDOM.classList.add('tokens')
    let html = '';
    html += `<p>Resultado</p><p>${value}</p>`
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
const btnBorrar = document.getElementById('borrar')
const btnDemos = document.getElementById('demos')
const btnSaiyan = document.getElementById('saiyan')
const demosDOM = document.querySelector('.demos-wrapper')
const demosDOMBtns = document.querySelectorAll('.demos button')
const img = document.querySelector('img')

let keys = []

let saiyan = false

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
btnSaiyan.addEventListener('click', () => {
  saiyan = !saiyan
  if(saiyan) {
    playSound('lexer')
    img.classList.remove('hidden')
  } else {
    playSound('bye')
    img.classList.add('hidden')
  }
})
btnBorrar.addEventListener('click', () => {
  playSound('tik')
  input.value = ''
})
btnDemos.addEventListener('click', showDemos)

const demosValues = [
`VAR a = "Lorem ipsum dolor sit amet."

VAR b = -85.5

VAR c = [123, "Hola mundo!"]`,

`VAR a = VAR b = 50

VAR c = 25

VAR a = b > c`,

`VAR a = FUNCTION saludar(persona) => "Hola, " + persona + "!"

a("Andres")`,

`IF 1 == 1 THEN "SI" ELSE "NO"`,

`IF 1 != 1 THEN 
  "SI"
ELSE
  "NO"
END`,

`IF "A" == "B" THEN 
"Amarillo"
ELSE 
  IF "B" != "B" THEN
  "Azul"
  ELSE
    IF  1 && 1-1 THEN
    "Rojo"
    ELSE
    "Verde"
    END
  END
END`,

`FOR i = 1 TO 9 THEN 2 ^ i`,

`VAR i = 0
WHILE i < 10 THEN VAR i = i + 1`,

`VAR i = 1
WHILE i < 10 THEN
  VAR i = i * 2
END`,

`FUNCTION sumar(a,b) => a+b
sumar(20,-5)`,

`FUNCTION contar(numeros)
  FOR i = 0 TO LEN(numeros) THEN
  numeros / i
  END
END
contar([1,2,3])`,

`FUNCTION contar(numeros) => FOR i = 0 TO LEN(numeros) THEN numeros / i
contar([1,2,3])`,

`NOTA()

INTEGRANTES()

NOW()

LEN(["Manzana", "Pera", "Naranja"])

PRINT("Buenos días!")`

]

demosDOMBtns.forEach((btn,i) => {
  btn.addEventListener('click', () => clickDemoBtn(demosValues[i]))
})

form.addEventListener('submit', (e) => e.preventDefault())

function showDemos() {  
  playSound('tik')
  console.log('hi')
  demosDOM.classList.remove('hidden')
}

function clickDemoBtn(value) {
  playSound('tok')
  input.value = value
  demosDOM.classList.add('hidden')
}

document.onkeydown = function(e) {    
  switch (e.keyCode) { 
      case 112 : // F1 button
          e.returnValue = false;
          e.keyCode = 0;
          run(input.value, btnLexer.id); 
          return false; 
      case 113 : // F2 button
          e.returnValue = false;
          e.keyCode = 0;
          run(input.value, btnParser.id); 
          return false; 
      case 114 : // F3 button
          e.returnValue = false;
          e.keyCode = 0;
          run(input.value, btnInterpreter.id); 
          return false; 
  }
}

function playSound(name) {
  console.log('hi')
  let audio;
  if(!saiyan) {
    audio = document.getElementById(`sound-${name}-saiyan`)
  } else {
    audio = document.getElementById(`sound-${name}`)
  }
  if(!audio) return; //Detiene la funcion
  const audios = document.querySelectorAll('audio')
  audios.forEach(audio => {
    audio.pause();
    audio.currentTime = 0; //Vuelve a Empezar
  })
  audio.play();
  console.log(audio)

}
/*

/////////////////////////////
// ASIGNACION DE VARIABLES //
/////////////////////////////
VAR a = VAR b = 50
VAR c = 25

VAR a = b > c

VAR a = VAR b = VAR c = 10
[a,b,c]

VAR a = FUNCTION saludar(persona) => "Hola, " + persona + "!"
a("Andres")

////////////////////////
// OPERADORES LOGICOS //
////////////////////////
IF 1 == 1 THEN 
  "SI"
ELSE
  "NO"
END


1 == 10
1 != 10
1 < 10
1 <= 10
1 > 10
1 >= 10
TRUE
FALSE
1 || 0
1 && 0

///////////
// LOOPS //
///////////
FOR i = 1 TO 9 THEN 2 ^ i

VAR i = 0
WHILE i < 10 THEN VAR i = i + 1

VAR i = 1
WHILE i < 10 THEN
  VAR i = i * 2
END

///////////////
// FUNCIONES //
///////////////
FUNCTION sumar(a,b) => a+b
sumar(20,-5)

FUNCTION contar(numeros)
  FOR i = 0 TO LEN(numeros) THEN
  numeros / i
  END
END
contar([1,2,3])

FUNCTION contar(numeros) => FOR i = 0 TO LEN(numeros) THEN numeros / i
contar([1,2,3])

/////////////////////////////
// FUNCIONES PRE-DEFINIDAS //
/////////////////////////////
NOW()
LEN(["Manzana", "Pera", "Naranja"])
PRINT("Buenos días!")
NOTA()
INTEGRANTES()

// Posibles Test Demos

VAR a = VAR b = VAR c = 10

VAR a = 2 + 8 == 5 + 5

VAR a = 1 == 1 && 2 == 2

[a,b,c] 

FUNCTION sumar(a,b) => a+b
sumar(20,-5)

FUNCTION saludar(persona) => "Hola, " + persona
saludar("Andres Molero")

FOR i = 1 TO 9 THEN 2 ^ i

PRINT(["foo", "bar", "Jose", "Perez"])


[[[[[[5]]],NOW()]],b,c] 

FUNCTION saludar(persona) => "Hola, " + persona

saludar("Andres Molero")

VAR i = 0
WHILE i < 10 THEN VAR i = i + 1

// INFORMACION
Numeros:
5
29.99
-5

Strings:
"Lorem ipsum dolor sit amet consectetur adipisicing elit. Exercitationem quod tempora, neque eum, itaque fugit quae maiores, illo architecto obcaecati ipsum totam. Veniam ipsum culpa sapiente, cupiditate molestias corporis maxime!"

Arrays:
["Hola", 123]

Operadores Logicos:
1 == 10
1 != 10
1 < 10
1 <= 10
1 > 10
1 >= 10
TRUE
FALSE
1 || 0
1 && 0

Varibles:
VAR a = 5
VAR b = "Jorge"
VAR c = 5 == 6

Funciones built-in:
NOW()
LEN(["Manzana", "Pera", "Naranja"])
PRINT("Buenos días!")
NOTA()
INTEGRANTES()


Operaciones:
FUNCTION saludar(persona) => "Hola, " + persona
saludar("Andres Molero")

VAR i = 0
WHILE i < 10 THEN VAR i = i + 1

VAR i = 0
WHILE i < 10 THEN
VAR i = i + 1
END

VAR a = VAR b = 10
IF a == b THEN "SI" ELSE "NO"

VAR a = FUNCTION saludar(persona) => "Hola, " + persona
a("Jorge") + " Mitri"


IF 1 == 1 THEN 
  "SI"
ELSE
  "NO"
END

IF 1 == 1 THEN "SI" ELSE "NO"

FUNCTION contar(numeros)
  FOR i = 0 TO LEN(numeros) THEN
  numeros / i
  END
END
contar([1,2,3])

FUNCTION contar(numeros) => FOR i = 0 TO LEN(numeros) THEN numeros / i
contar([1,2,3])
*/