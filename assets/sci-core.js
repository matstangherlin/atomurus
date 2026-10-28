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

  /* Degrees by default, the way school trigonometry is taught; the page shows
     DEG/RAD on the display and lets the user switch. An owner decision. */
  var DEFAULT_ANGLE_MODE = 'deg';
  var ANGLE_STORAGE_KEY = 'atomurus-sci-angle';

  function normalizeAngleMode(mode) {
    return mode === 'rad' || mode === 'deg' ? mode : DEFAULT_ANGLE_MODE;
  }

  var SCI_FUNCTION_INFO = {
    log: { en: 'log(x) is the base-10 logarithm; log(x, b) uses base b. ln(x) is the natural logarithm.', pt: 'log(x) é o logaritmo na base 10; log(x, b) usa a base b. ln(x) é o logaritmo natural.' },
    lg: { en: 'lg(x) = log(x), the base-10 logarithm.', pt: 'lg(x) = log(x), o logaritmo na base 10.' },
    round: { en: 'round(x) rounds halves away from zero (2.5 → 3, −2.5 → −3); round(x, n) keeps n decimals.', pt: 'round(x) arredonda o meio para longe do zero (2,5 → 3; −2,5 → −3); round(x, n) mantém n casas.' },
    sin: { en: 'sin, cos and tan read the angle in the mode shown on the display (DEG or RAD).', pt: 'sin, cos e tan leem o ângulo no modo mostrado no visor (DEG ou RAD).' },
    cos: { en: 'sin, cos and tan read the angle in the mode shown on the display (DEG or RAD).', pt: 'sin, cos e tan leem o ângulo no modo mostrado no visor (DEG ou RAD).' },
    tan: { en: 'sin, cos and tan read the angle in the mode shown on the display (DEG or RAD).', pt: 'sin, cos e tan leem o ângulo no modo mostrado no visor (DEG ou RAD).' },
    asin: { en: 'asin, acos and atan return the angle in the mode shown on the display (DEG or RAD).', pt: 'asin, acos e atan devolvem o ângulo no modo mostrado no visor (DEG ou RAD).' },
    acos: { en: 'asin, acos and atan return the angle in the mode shown on the display (DEG or RAD).', pt: 'asin, acos e atan devolvem o ângulo no modo mostrado no visor (DEG ou RAD).' },
    atan: { en: 'asin, acos and atan return the angle in the mode shown on the display (DEG or RAD).', pt: 'asin, acos e atan devolvem o ângulo no modo mostrado no visor (DEG ou RAD).' },
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

  /* Every error carries a code (and the names it is about) so the page can
     say it in the reader's language; message stays as an English fallback.
     Codes: div0, domain, incomplete, syntax, unknownFn, unknownConst, arity,
     factorial, notNumber, overflow, unavailable. */
  function sciError(code, params, message) {
    var err = new Error(message);
    err.code = code;
    err.params = params || {};
    return err;
  }

  function fnOf(label) {
    var m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(String(label || ''));
    return m ? m[0] + '()' : '';
  }

  function sciNumber(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw sciError('notNumber', { fn: fnOf(label) }, label + ' requires a numeric value');
    return value;
  }

  function sciPositive(value, message) {
    if (!(value > 0)) throw sciError('domain', { fn: fnOf(message) }, message);
    return value;
  }

  function domain(fn, message) {
    return sciError('domain', { fn: fn }, message);
  }

  function sciFactorial(x) {
    if (!Number.isInteger(x) || x < 0) throw sciError('factorial', {}, 'factorial requires a non-negative integer');
    if (x > 170) throw sciError('factorial', {}, 'factorial input is too large');
    var out = 1;
    for (var i = 2; i <= x; i++) out *= i;
    return out;
  }

  /* Half away from zero, the school convention: Math.round sends -2.5 to -2.
     toPrecision(15) first, so 1.005 × 100 rounds as the 100.5 it is meant to be. */
  function roundHalfAway(x, digits) {
    var f = Math.pow(10, digits || 0);
    var scaled = Number((Math.abs(x) * f).toPrecision(15));
    var out = Math.sign(x) * Math.round(scaled) / f;
    return out === 0 ? 0 : out;
  }

  /* Trig in the context's angle mode. Results this close to zero are zero:
     sin(180°) is 0, not 1.2e-16. */
  function tidy(v) {
    return Math.abs(v) < 1e-15 ? 0 : v;
  }

  /* Functions that need the page (molarMass) read it from the evaluation context. */
  function makeFunctions(ctx) {
    var deg = normalizeAngleMode(ctx.angleMode) === 'deg';
    function toRad(x) { return deg ? x * Math.PI / 180 : x; }
    function fromRad(x) { return deg ? x * 180 / Math.PI : x; }
    function inverse(name, fn, x) {
      x = sciNumber(x, name + '()');
      if (x < -1 || x > 1) throw domain(name + '()', name + '() requires a value between -1 and 1');
      return tidy(fromRad(fn(x)));
    }
    function logBase(x, base, label) {
      x = sciNumber(x, label);
      if (x <= 0) throw domain(label, label + ' requires a positive value');
      if (base === undefined) return Math.log10(x);
      base = sciNumber(base, label);
      if (!(base > 0) || base === 1) throw domain(label, label + ' requires a positive base other than 1');
      return Math.log(x) / Math.log(base);
    }
    return {
      sqrt: function (x) {
        x = sciNumber(x, 'sqrt()');
        if (x < 0) throw domain('sqrt()', 'sqrt() requires a non-negative value');
        return Math.sqrt(x);
      },
      log10: function (x) {
        x = sciNumber(x, 'log10()');
        if (x <= 0) throw domain('log10()', 'log10() requires a positive value');
        return Math.log10(x);
      },
      ln: function (x) {
        x = sciNumber(x, 'ln()');
        if (x <= 0) throw domain('ln()', 'ln() requires a positive value');
        return Math.log(x);
      },
      log: function (x, base) { return logBase(x, base, 'log()'); },
      lg: function (x) { return logBase(x, undefined, 'lg()'); },
      exp: function (x) { return Math.exp(sciNumber(x, 'exp()')); },
      sin: function (x) { return tidy(Math.sin(toRad(sciNumber(x, 'sin()')))); },
      cos: function (x) { return tidy(Math.cos(toRad(sciNumber(x, 'cos()')))); },
      tan: function (x) {
        x = sciNumber(x, 'tan()');
        /* tan is undefined at 90° + k·180°; in degrees that is exact. */
        if (deg && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) throw domain('tan()', 'tan() is undefined at 90° + k·180°');
        return tidy(Math.tan(toRad(x)));
      },
      asin: function (x) { return inverse('asin', Math.asin, x); },
      acos: function (x) { return inverse('acos', Math.acos, x); },
      atan: function (x) { return tidy(fromRad(Math.atan(sciNumber(x, 'atan()')))); },
      abs: function (x) { return Math.abs(sciNumber(x, 'abs()')); },
      round: function (x, digits) {
        x = sciNumber(x, 'round()');
        if (digits === undefined) return roundHalfAway(x, 0);
        digits = sciNumber(digits, 'round(x, n)');
        if (!Number.isInteger(digits) || digits < 0 || digits > 12) throw domain('round()', 'round(x, n) requires a whole n from 0 to 12');
        return roundHalfAway(x, digits);
      },
      pH: function (x) {
        x = sciNumber(x, 'pH()');
        if (x <= 0) throw domain('pH()', 'pH() requires a positive concentration');
        return -Math.log10(x);
      },
      pOH: function (x) {
        x = sciNumber(x, 'pOH()');
        if (x <= 0) throw domain('pOH()', 'pOH() requires a positive concentration');
        return -Math.log10(x);
      },
      HfromPH: function (x) { return Math.pow(10, -sciNumber(x, 'HfromPH()')); },
      OHfromPOH: function (x) { return Math.pow(10, -sciNumber(x, 'OHfromPOH()')); },
      molarMass: function (formula) {
        if (typeof ctx.molarMass !== 'function') throw sciError('unavailable', { fn: 'molarMass()' }, 'molarMass() is not available here');
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

  /* A number, or the list of argument counts a function accepts. */
  var SCI_ARITY = {
    sqrt: 1, log10: 1, log: [1, 2], lg: 1, ln: 1, exp: 1, sin: 1, cos: 1, tan: 1,
    asin: 1, acos: 1, atan: 1, abs: 1, round: [1, 2],
    pH: 1, HfromPH: 1, pOH: 1, OHfromPOH: 1, molarMass: 1,
    molToParticles: 1, particlesToMol: 1, idealGas: 4, density: 2,
    molarity: 2, dilution: 3, percentYield: 2, factorial: 1
  };

  var SCI_LIBRARY = [
    { name: 'log', insert: 'log()', keywords: 'log log10 logarithm base ten lg' },
    { name: 'sin', insert: 'sin()', keywords: 'sine trigonometry angle degrees radians' },
    { name: 'asin', insert: 'asin()', keywords: 'arcsine inverse trigonometry angle' },
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
    if (expected == null) return;
    var allowed = [].concat(expected);
    if (allowed.indexOf(args.length) === -1) {
      var said = allowed.join(' or ');
      throw sciError('arity', { fn: name + '()', n: allowed.join('/') }, name + '() expects ' + said + ' argument' + (allowed.length === 1 && allowed[0] === 1 ? '' : 's'));
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
            if (i >= input.length) throw sciError('incomplete', {}, 'Invalid string literal');
            var escaped = input[i++];
            raw += escaped;
            value += escaped;
            continue;
          }
          if (next === quote) { closed = true; break; }
          value += next;
        }
        if (!closed) throw sciError('incomplete', {}, 'Unterminated string literal');
        tokens.push({ type: 'string', value: value, raw: raw });
        continue;
      }
      if ('+-*/^(),!'.indexOf(ch) !== -1) {
        tokens.push({ type: ch, value: ch, raw: ch });
        i++;
        continue;
      }
      throw sciError('syntax', { token: ch }, (syntaxLabel || 'Invalid syntax') + ': ' + ch);
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
    if (!token) {
      if (this.peek().type === 'eof') throw sciError('incomplete', {}, 'Expected "' + type + '"');
      throw sciError('syntax', { token: this.peek().raw }, 'Expected "' + type + '"');
    }
    return token;
  };
  ScientificParser.prototype.parse = function () {
    var value = this.parseAddSub();
    if (this.peek().type !== 'eof') throw sciError('syntax', { token: this.peek().raw }, 'Unexpected token "' + this.peek().raw + '"');
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
    var value = this.parseUnary();
    while (this.peek().type === '*' || this.peek().type === '/') {
      var op = this.tokens[this.pos++].type;
      var right = this.parseUnary();
      value = sciNumber(value, 'left operand');
      sciNumber(right, 'right operand');
      if (op === '/' && right === 0) throw sciError('div0', {}, 'Division by zero');
      value = op === '*' ? value * right : value / right;
    }
    return value;
  };
  /* A sign applies to the whole power, as in mathematics: -2^2 = -(2^2).
     The exponent may carry its own sign (2^-3), and ^ groups to the right
     (2^3^2 = 2^9). */
  ScientificParser.prototype.parseUnary = function () {
    if (this.take('+')) return this.parseUnary();
    if (this.take('-')) return -this.parseUnary();
    return this.parsePower();
  };
  ScientificParser.prototype.parsePower = function () {
    var value = this.parsePostfix();
    if (this.peek().type === '^') {
      this.pos++;
      value = Math.pow(sciNumber(value, 'base'), sciNumber(this.parseUnary(), 'exponent'));
    }
    return value;
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
        if (!fn) throw sciError('unknownFn', { name: name }, 'Unknown function "' + name + '"');
        sciCheckArity(name, args);
        this.usedFunctions.add(name);
        var value = fn.apply(null, args);
        if (!Number.isFinite(value)) throw sciError(Number.isNaN(value) ? 'domain' : 'overflow', { fn: name + '()' }, 'Function "' + name + '" returned an invalid value');
        return value;
      }
      if (Object.prototype.hasOwnProperty.call(SCI_CONSTANTS, name)) {
        this.usedConstants.add(name);
        return SCI_CONSTANTS[name];
      }
      throw sciError('unknownConst', { name: name }, 'Unknown constant "' + name + '"');
    }
    if (this.take('(')) {
      var inner = this.parseAddSub();
      this.expect(')');
      return inner;
    }
    if (this.peek().type === 'eof') throw sciError('incomplete', {}, 'Unexpected end of expression');
    throw sciError('syntax', { token: this.peek().raw }, 'Unexpected token "' + this.peek().raw + '"');
  };

  /* opts: { molarMass(formula) → g/mol, syntaxLabel, angleMode: 'deg' | 'rad' } */
  function evaluateScientificExpression(expr, opts) {
    opts = opts || {};
    var parser = new ScientificParser(tokenizeScientificExpression(expr, opts.syntaxLabel), opts);
    var value = parser.parse();
    if (typeof value !== 'number') throw sciError('notNumber', {}, 'The result is not a number');
    if (!Number.isFinite(value)) throw sciError('overflow', {}, 'Result is not finite');
    return { value: value, constants: Array.from(parser.usedConstants), functions: Array.from(parser.usedFunctions) };
  }

  return {
    DEFAULT_ANGLE_MODE: DEFAULT_ANGLE_MODE,
    ANGLE_STORAGE_KEY: ANGLE_STORAGE_KEY,
    normalizeAngleMode: normalizeAngleMode,
    roundHalfAway: roundHalfAway,
    SCI_CONSTANTS: SCI_CONSTANTS,
    SCI_FUNCTION_INFO: SCI_FUNCTION_INFO,
    SCI_FUNCTIONS: SCI_FUNCTIONS,
    SCI_ARITY: SCI_ARITY,
    SCI_LIBRARY: SCI_LIBRARY,
    sciNumber: sciNumber,
    sciPositive: sciPositive,
    sciFactorial: sciFactorial,
    sciError: sciError,
    tokenizeScientificExpression: tokenizeScientificExpression,
    ScientificParser: ScientificParser,
    evaluateScientificExpression: evaluateScientificExpression
  };
});
