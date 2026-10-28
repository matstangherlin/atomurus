/* Scientific calculator engine: tokenizer, parser, functions and constants.
   No DOM. Loaded as a classic <script> by calculators*.html (window.AtomurusSci)
   and by Node tests (module.exports). The page supplies what depends on it:
   molarMass(formula) and the localized label for a syntax error. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusSci = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SCI_CONSTANTS = {
    NA: 6.02214076e23,
    R: 8.314462618,
    F: 96485.33212,
    Kw: 1e-14,
    c: 299792458,
    h: 6.62607015e-34,
    pi: Math.PI,
    e: Math.E
  };

  var SCI_FUNCTION_INFO = {
    pH: { en: 'pH(H) = -log10(H), for hydrogen ion concentration in mol/L.', pt: 'pH(H) = -log10(H), para concentração de H+ em mol/L.' },
    HfromPH: { en: 'HfromPH(pH) = 10^-pH, converting pH to [H+].', pt: 'HfromPH(pH) = 10^-pH, convertendo pH para [H+].' },
    pOH: { en: 'pOH(OH) = -log10(OH), for hydroxide ion concentration in mol/L.', pt: 'pOH(OH) = -log10(OH), para concentração de OH- em mol/L.' },
    OHfromPOH: { en: 'OHfromPOH(pOH) = 10^-pOH, converting pOH to [OH-].', pt: 'OHfromPOH(pOH) = 10^-pOH, convertendo pOH para [OH-].' },
    molarMass: { en: 'molarMass("formula") parses a formula and returns g/mol.', pt: 'molarMass("formula") interpreta uma fórmula e retorna g/mol.' },
    molToParticles: { en: 'molToParticles(mol) multiplies moles by Avogadro constant NA.', pt: 'molToParticles(mol) multiplica mols pela constante de Avogadro NA.' },
    particlesToMol: { en: 'particlesToMol(n) divides particle count by Avogadro constant NA.', pt: 'particlesToMol(n) divide partículas pela constante de Avogadro NA.' },
    idealGas: { en: 'idealGas(P,V,n,T) returns PV/(nT), the gas-constant equivalent in coherent units.', pt: 'idealGas(P,V,n,T) retorna PV/(nT), equivalente à constante dos gases em unidades coerentes.' },
    density: { en: 'density(mass,volume) returns mass divided by volume.', pt: 'density(mass,volume) retorna massa dividida por volume.' },
    molarity: { en: 'molarity(mol,volume) returns mol per volume.', pt: 'molarity(mol,volume) retorna mol por volume.' },
    dilution: { en: 'dilution(C1,V1,C2) solves V2 from C1V1 = C2V2.', pt: 'dilution(C1,V1,C2) resolve V2 a partir de C1V1 = C2V2.' },
    percentYield: { en: 'percentYield(actual,theoretical) returns reaction yield in percent.', pt: 'percentYield(actual,theoretical) retorna o rendimento percentual da reação.' }
  };

  function sciNumber(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(label + ' requires a numeric value');
    return value;
  }

  function sciPositive(value, message) {
    if (!(value > 0)) throw new Error(message);
    return value;
  }

  function sciFactorial(x) {
    if (!Number.isInteger(x) || x < 0) throw new Error('factorial requires a non-negative integer');
    if (x > 170) throw new Error('factorial input is too large');
    var out = 1;
    for (var i = 2; i <= x; i++) out *= i;
    return out;
  }

  /* Functions that need the page (molarMass) read it from the evaluation context. */
  function makeFunctions(ctx) {
    return {
      sqrt: function (x) {
        x = sciNumber(x, 'sqrt()');
        if (x < 0) throw new Error('sqrt() requires a non-negative value');
        return Math.sqrt(x);
      },
      log10: function (x) {
        x = sciNumber(x, 'log10()');
        if (x <= 0) throw new Error('log10() requires a positive value');
        return Math.log10(x);
      },
      ln: function (x) {
        x = sciNumber(x, 'ln()');
        if (x <= 0) throw new Error('ln() requires a positive value');
        return Math.log(x);
      },
      exp: function (x) { return Math.exp(sciNumber(x, 'exp()')); },
      sin: function (x) { return Math.sin(sciNumber(x, 'sin()')); },
      cos: function (x) { return Math.cos(sciNumber(x, 'cos()')); },
      tan: function (x) { return Math.tan(sciNumber(x, 'tan()')); },
      abs: function (x) { return Math.abs(sciNumber(x, 'abs()')); },
      round: function (x) { return Math.round(sciNumber(x, 'round()')); },
      pH: function (x) {
        x = sciNumber(x, 'pH()');
        if (x <= 0) throw new Error('pH() requires a positive concentration');
        return -Math.log10(x);
      },
      pOH: function (x) {
        x = sciNumber(x, 'pOH()');
        if (x <= 0) throw new Error('pOH() requires a positive concentration');
        return -Math.log10(x);
      },
      HfromPH: function (x) { return Math.pow(10, -sciNumber(x, 'HfromPH()')); },
      OHfromPOH: function (x) { return Math.pow(10, -sciNumber(x, 'OHfromPOH()')); },
      molarMass: function (formula) {
        if (typeof ctx.molarMass !== 'function') throw new Error('molarMass() is not available here');
        return ctx.molarMass(formula);
      },
      molToParticles: function (x) { return sciNumber(x, 'molToParticles()') * SCI_CONSTANTS.NA; },
      particlesToMol: function (x) { return sciNumber(x, 'particlesToMol()') / SCI_CONSTANTS.NA; },
      idealGas: function (P, V, n, T) {
        P = sciNumber(P, 'idealGas(P)');
        V = sciNumber(V, 'idealGas(V)');
        n = sciPositive(sciNumber(n, 'idealGas(n)'), 'idealGas() requires n > 0');
        T = sciPositive(sciNumber(T, 'idealGas(T)'), 'idealGas() requires T > 0');
        return (P * V) / (n * T);
      },
      density: function (mass, volume) {
        volume = sciPositive(sciNumber(volume, 'density(volume)'), 'density() requires volume > 0');
        return sciNumber(mass, 'density(mass)') / volume;
      },
      molarity: function (mol, volume) {
        volume = sciPositive(sciNumber(volume, 'molarity(volume)'), 'molarity() requires volume > 0');
        return sciNumber(mol, 'molarity(mol)') / volume;
      },
      dilution: function (C1, V1, C2) {
        C2 = sciPositive(sciNumber(C2, 'dilution(C2)'), 'dilution() requires C2 > 0');
        return sciNumber(C1, 'dilution(C1)') * sciNumber(V1, 'dilution(V1)') / C2;
      },
      percentYield: function (actual, theoretical) {
        theoretical = sciPositive(sciNumber(theoretical, 'percentYield(theoretical)'), 'percentYield() requires theoretical > 0');
        return sciNumber(actual, 'percentYield(actual)') / theoretical * 100;
      },
      factorial: function (x) { return sciFactorial(sciNumber(x, 'factorial()')); }
    };
  }

  var SCI_FUNCTIONS = makeFunctions({});

  var SCI_ARITY = {
    sqrt: 1, log10: 1, ln: 1, exp: 1, sin: 1, cos: 1, tan: 1, abs: 1, round: 1,
    pH: 1, HfromPH: 1, pOH: 1, OHfromPOH: 1, molarMass: 1,
    molToParticles: 1, particlesToMol: 1, idealGas: 4, density: 2,
    molarity: 2, dilution: 3, percentYield: 2, factorial: 1
  };

  var SCI_LIBRARY = [
    { name: 'pH', insert: 'pH()', keywords: 'ph acid hydrogen h concentration' },
    { name: 'HfromPH', insert: 'HfromPH()', keywords: 'ph hydrogen concentration h' },
    { name: 'pOH', insert: 'pOH()', keywords: 'ph poh base hydroxide oh concentration' },
    { name: 'OHfromPOH', insert: 'OHfromPOH()', keywords: 'poh ph hydroxide oh concentration' },
    { name: 'molarMass', insert: 'molarMass("H2SO4")', keywords: 'formula mass molar molecular weight' },
    { name: 'molToParticles', insert: 'molToParticles()', keywords: 'moles particles avogadro molecules atoms' },
    { name: 'particlesToMol', insert: 'particlesToMol()', keywords: 'ph particles moles avogadro molecules atoms' },
    { name: 'idealGas', insert: 'idealGas(101325,0.024465,1,298.15)', keywords: 'gas pv nrt pressure volume temperature r' },
    { name: 'density', insert: 'density()', keywords: 'mass volume density' },
    { name: 'molarity', insert: 'molarity()', keywords: 'moles volume concentration molar solution' },
    { name: 'dilution', insert: 'dilution()', keywords: 'c1 v1 c2 v2 dilution solution' },
    { name: 'percentYield', insert: 'percentYield()', keywords: 'yield reaction actual theoretical percent' },
    { name: 'round', insert: 'round()', keywords: 'round nearest integer' }
  ];

  function sciCheckArity(name, args) {
    var expected = SCI_ARITY[name];
    if (expected != null && args.length !== expected) {
      throw new Error(name + '() expects ' + expected + ' argument' + (expected === 1 ? '' : 's'));
    }
  }

  function tokenizeScientificExpression(source, syntaxLabel) {
    var input = String(source).replace(/[×]/g, '*').replace(/[÷]/g, '/').replace(/[−]/g, '-');
    var tokens = [];
    var i = 0;
    while (i < input.length) {
      var ch = input[i];
      if (/\s/.test(ch)) { i++; continue; }
      var rest = input.slice(i);
      var num = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (num) {
        tokens.push({ type: 'number', value: Number(num[0]), raw: num[0] });
        i += num[0].length;
        continue;
      }
      var id = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (id) {
        tokens.push({ type: 'id', value: id[0], raw: id[0] });
        i += id[0].length;
        continue;
      }
      if (ch === '"' || ch === "'") {
        var quote = ch;
        var value = '';
        var raw = quote;
        i++;
        var closed = false;
        while (i < input.length) {
          var next = input[i++];
          raw += next;
          if (next === '\\') {
            if (i >= input.length) throw new Error('Invalid string literal');
            var escaped = input[i++];
            raw += escaped;
            value += escaped;
            continue;
          }
          if (next === quote) { closed = true; break; }
          value += next;
        }
        if (!closed) throw new Error('Unterminated string literal');
        tokens.push({ type: 'string', value: value, raw: raw });
        continue;
      }
      if ('+-*/^(),!'.indexOf(ch) !== -1) {
        tokens.push({ type: ch, value: ch, raw: ch });
        i++;
        continue;
      }
      throw new Error((syntaxLabel || 'Invalid syntax') + ': ' + ch);
    }
    tokens.push({ type: 'eof', value: null, raw: '' });
    return tokens;
  }

  function ScientificParser(tokens, ctx) {
    this.tokens = tokens;
    this.pos = 0;
    this.usedConstants = new Set();
    this.usedFunctions = new Set();
    this.functions = makeFunctions(ctx || {});
  }
  ScientificParser.prototype.peek = function () { return this.tokens[this.pos]; };
  ScientificParser.prototype.take = function (type) {
    if (this.peek().type === type) return this.tokens[this.pos++];
    return null;
  };
  ScientificParser.prototype.expect = function (type) {
    var token = this.take(type);
    if (!token) throw new Error('Expected "' + type + '"');
    return token;
  };
  ScientificParser.prototype.parse = function () {
    var value = this.parseAddSub();
    if (this.peek().type !== 'eof') throw new Error('Unexpected token "' + this.peek().raw + '"');
    return value;
  };
  ScientificParser.prototype.parseAddSub = function () {
    var value = this.parseMulDiv();
    while (this.peek().type === '+' || this.peek().type === '-') {
      var op = this.tokens[this.pos++].type;
      var right = this.parseMulDiv();
      value = sciNumber(value, 'left operand');
      sciNumber(right, 'right operand');
      value = op === '+' ? value + right : value - right;
    }
    return value;
  };
  ScientificParser.prototype.parseMulDiv = function () {
    var value = this.parsePower();
    while (this.peek().type === '*' || this.peek().type === '/') {
      var op = this.tokens[this.pos++].type;
      var right = this.parsePower();
      value = sciNumber(value, 'left operand');
      sciNumber(right, 'right operand');
      value = op === '*' ? value * right : value / right;
    }
    return value;
  };
  ScientificParser.prototype.parsePower = function () {
    var value = this.parseUnary();
    if (this.peek().type === '^') {
      this.pos++;
      value = Math.pow(sciNumber(value, 'base'), sciNumber(this.parsePower(), 'exponent'));
    }
    return value;
  };
  ScientificParser.prototype.parseUnary = function () {
    if (this.take('+')) return this.parseUnary();
    if (this.take('-')) return -this.parseUnary();
    return this.parsePostfix();
  };
  ScientificParser.prototype.parsePostfix = function () {
    var value = this.parsePrimary();
    while (this.take('!')) value = sciFactorial(value);
    return value;
  };
  ScientificParser.prototype.parseArguments = function () {
    var args = [];
    if (this.take(')')) return args;
    do {
      args.push(this.parseAddSub());
    } while (this.take(','));
    this.expect(')');
    return args;
  };
  ScientificParser.prototype.parsePrimary = function () {
    var num = this.take('number');
    if (num) return num.value;
    var str = this.take('string');
    if (str) return str.value;
    var id = this.take('id');
    if (id) {
      var name = id.value;
      if (this.take('(')) {
        var args = this.parseArguments();
        var fn = Object.prototype.hasOwnProperty.call(this.functions, name) ? this.functions[name] : null;
        if (!fn) throw new Error('Unknown function "' + name + '"');
        sciCheckArity(name, args);
        this.usedFunctions.add(name);
        var value = fn.apply(null, args);
        if (!Number.isFinite(value)) throw new Error('Function "' + name + '" returned an invalid value');
        return value;
      }
      if (Object.prototype.hasOwnProperty.call(SCI_CONSTANTS, name)) {
        this.usedConstants.add(name);
        return SCI_CONSTANTS[name];
      }
      throw new Error('Unknown constant "' + name + '"');
    }
    if (this.take('(')) {
      var inner = this.parseAddSub();
      this.expect(')');
      return inner;
    }
    throw new Error('Unexpected token "' + this.peek().raw + '"');
  };

  /* opts: { molarMass(formula) → g/mol, syntaxLabel } */
  function evaluateScientificExpression(expr, opts) {
    opts = opts || {};
    var parser = new ScientificParser(tokenizeScientificExpression(expr, opts.syntaxLabel), opts);
    var value = parser.parse();
    if (!Number.isFinite(value)) throw new Error('Result is not finite');
    return { value: value, constants: Array.from(parser.usedConstants), functions: Array.from(parser.usedFunctions) };
  }

  return {
    SCI_CONSTANTS: SCI_CONSTANTS,
    SCI_FUNCTION_INFO: SCI_FUNCTION_INFO,
    SCI_FUNCTIONS: SCI_FUNCTIONS,
    SCI_ARITY: SCI_ARITY,
    SCI_LIBRARY: SCI_LIBRARY,
    sciNumber: sciNumber,
    sciPositive: sciPositive,
    sciFactorial: sciFactorial,
    tokenizeScientificExpression: tokenizeScientificExpression,
    ScientificParser: ScientificParser,
    evaluateScientificExpression: evaluateScientificExpression
  };
});
