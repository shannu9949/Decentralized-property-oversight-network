"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codegenAbstractContractFactory = exports.codegenContractFactory = exports.codegenContractTypings = void 0;
const lodash_1 = require("lodash");
const typechain_1 = require("typechain");
const common_1 = require("../common");
const events_1 = require("./events");
const functions_1 = require("./functions");
const reserved_keywords_1 = require("./reserved-keywords");
const structs_1 = require("./structs");
const types_1 = require("./types");
function codegenContractTypings(contract, codegenConfig) {
    const { alwaysGenerateOverloads } = codegenConfig;
    const source = `
  ${(0, structs_1.generateStructTypes)((0, lodash_1.values)(contract.structs).map((v) => v[0]))}

  export interface ${contract.name}Interface extends utils.Interface {
    functions: {
      ${(0, lodash_1.values)(contract.functions)
        .flatMap((v) => v.map(functions_1.generateInterfaceFunctionDescription))
        .join('\n')}
    };

    ${(0, functions_1.generateGetFunction)((0, lodash_1.values)(contract.functions).flatMap((v) => processDeclaration(v, alwaysGenerateOverloads, functions_1.generateFunctionNameOrSignature)))}

    ${(0, lodash_1.values)(contract.functions)
        .flatMap((v) => processDeclaration(v, alwaysGenerateOverloads, functions_1.generateEncodeFunctionDataOverload))
        .join('\n')}

    ${(0, lodash_1.values)(contract.functions)
        .flatMap((v) => processDeclaration(v, alwaysGenerateOverloads, functions_1.generateDecodeFunctionResultOverload))
        .join('\n')}

    events: {
      ${(0, lodash_1.values)(contract.events)
        .flatMap((v) => v.map(events_1.generateInterfaceEventDescription))
        .join('\n')}
    };

    ${(0, lodash_1.values)(contract.events)
        .flatMap((v) => processDeclaration(v, alwaysGenerateOverloads, events_1.generateGetEvent))
        .join('\n')}
  }

  ${(0, lodash_1.values)(contract.events).map(events_1.generateEventTypeExports).join('\n')}

  export interface ${contract.name} extends BaseContract {
    ${codegenConfig.discriminateTypes ? `contractName: '${contract.name}';\n` : ``}
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;

    interface: ${contract.name}Interface;

    ${events_1.EVENT_METHOD_OVERRIDES}

    functions: {
      ${(0, lodash_1.values)(contract.functions)
        .map(functions_1.codegenFunctions.bind(null, { returnResultObject: true, codegenConfig }))
        .join('\n')}
    };

    ${(0, lodash_1.values)(contract.functions)
        .filter((f) => !reserved_keywords_1.reservedKeywords.has(f[0].name))
        .map(functions_1.codegenFunctions.bind(null, { codegenConfig }))
        .join('\n')}

    callStatic: {
      ${(0, lodash_1.values)(contract.functions)
        .map(functions_1.codegenFunctions.bind(null, { isStaticCall: true, codegenConfig }))
        .join('\n')}
    };

    filters: {
      ${(0, lodash_1.values)(contract.events).map(events_1.generateEventFilters).join('\n')}
    };

    estimateGas: {
      ${(0, lodash_1.values)(contract.functions)
        .map(functions_1.codegenFunctions.bind(null, { overrideOutput: 'Promise<BigNumber>', codegenConfig }))
        .join('\n')}
    };

    populateTransaction: {
      ${(0, lodash_1.values)(contract.functions)
        .map(functions_1.codegenFunctions.bind(null, { overrideOutput: 'Promise<PopulatedTransaction>', codegenConfig }))
        .join('\n')}
    };
  }`;
    const commonPath = contract.path.length
        ? `${new Array(contract.path.length).fill('..').join('/')}/common`
        : './common';
    const imports = (0, typechain_1.createImportsForUsedIdentifiers)({
        'type ethers': [
            'BaseContract',
            'BigNumber',
            'BigNumberish',
            'BytesLike',
            'CallOverrides',
            'ContractTransaction',
            'Overrides',
            'PayableOverrides',
            'PopulatedTransaction',
            'Signer',
            'utils',
        ],
        'type @ethersproject/abi': ['FunctionFragment', 'Result', 'EventFragment'],
        'type @ethersproject/providers': ['Listener', 'Provider'],
    }, source) +
        '\n' +
        (0, typechain_1.createImportTypeDeclaration)([...events_1.EVENT_IMPORTS, 'PromiseOrValue'], commonPath);
    return imports + source;
}
exports.codegenContractTypings = codegenContractTypings;
function codegenContractFactory(codegenConfig, contract, abi, bytecode) {
    var _a;
    const constructorArgs = (contract.constructor[0] ? (0, types_1.generateInputTypes)(contract.constructor[0].inputs, { useStructs: true }) : '') +
        `overrides?: ${((_a = contract.constructor[0]) === null || _a === void 0 ? void 0 : _a.stateMutability) === 'payable'
            ? 'PayableOverrides & { from?: PromiseOrValue<string> }'
            : 'Overrides & { from?: PromiseOrValue<string> }'}`;
    const constructorArgNamesWithoutOverrides = contract.constructor[0]
        ? (0, functions_1.generateParamNames)(contract.constructor[0].inputs)
        : '';
    const constructorArgNames = constructorArgNamesWithoutOverrides
        ? `${constructorArgNamesWithoutOverrides}, overrides || {}`
        : 'overrides || {}';
    if (!bytecode)
        return codegenAbstractContractFactory(contract, abi);
    // tsc with noUnusedLocals would complain about unused imports
    const { body, header } = codegenCommonContractFactory(contract, abi);
    const source = `
  ${header}

  const _bytecode = "${bytecode.bytecode}";

  ${generateFactoryConstructorParamsAlias(contract, bytecode)}

  export class ${contract.name}${common_1.FACTORY_POSTFIX} extends ContractFactory {
    ${generateFactoryConstructor(codegenConfig, contract, bytecode)}
    override deploy(${constructorArgs}): Promise<${contract.name}> {
      return super.deploy(${constructorArgNames}) as Promise<${contract.name}>;
    }
    override getDeployTransaction(${constructorArgs}): TransactionRequest {
      return super.getDeployTransaction(${constructorArgNames});
    };
    override attach(address: string): ${contract.name} {
      return super.attach(address) as ${contract.name};
    }
    override connect(signer: Signer): ${contract.name}${common_1.FACTORY_POSTFIX} {
      return super.connect(signer) as ${contract.name}${common_1.FACTORY_POSTFIX};
    }
    ${codegenConfig.discriminateTypes ? `static readonly contractName: '${contract.name}';\n` : ``}
    ${codegenConfig.discriminateTypes ? `public readonly contractName: '${contract.name}';\n` : ``}
    static readonly bytecode = _bytecode;
    ${body}
  }

  ${generateLibraryAddressesInterface(contract, bytecode)}
  `;
    const commonPath = `${new Array(contract.path.length + 1).fill('..').join('/')}/common`;
    const imports = (0, typechain_1.createImportsForUsedIdentifiers)({
        ethers: [
            'Signer',
            'utils',
            'Contract',
            'ContractFactory',
            'PayableOverrides',
            'BytesLike',
            'BigNumberish',
            'Overrides',
        ],
        'type @ethersproject/providers': ['Provider', 'TransactionRequest'],
    }, source) +
        '\n' +
        (0, typechain_1.createImportTypeDeclaration)(['PromiseOrValue'], commonPath);
    return imports + source;
}
exports.codegenContractFactory = codegenContractFactory;
function codegenAbstractContractFactory(contract, abi) {
    const { body, header } = codegenCommonContractFactory(contract, abi);
    return `
  import { Contract, Signer, utils } from "ethers";
  import type { Provider } from "@ethersproject/providers";
  ${header}

  export class ${contract.name}${common_1.FACTORY_POSTFIX} {
    ${body}
  }
  `;
}
exports.codegenAbstractContractFactory = codegenAbstractContractFactory;
function codegenCommonContractFactory(contract, abi) {
    var _a;
    const imports = new Set([contract.name, contract.name + 'Interface']);
    (_a = contract.constructor[0]) === null || _a === void 0 ? void 0 : _a.inputs.forEach(({ type }) => {
        const { structName } = type;
        if (structName) {
            imports.add(structName.namespace || structName.identifier + common_1.STRUCT_INPUT_POSTFIX);
        }
    });
    const contractTypesImportPath = [...Array(contract.path.length + 1).fill('..'), ...contract.path, contract.name].join('/');
    const header = `
  import type { ${[...imports.values()].join(', ')} } from "${contractTypesImportPath}";

  const _abi = ${JSON.stringify(abi, null, 2)};
  `.trim();
    const body = `
    static readonly abi = _abi;
    static createInterface(): ${contract.name}Interface {
      return new utils.Interface(_abi) as ${contract.name}Interface;
    }
    static connect(address: string, signerOrProvider: Signer | Provider): ${contract.name} {
      return new Contract(address, _abi, signerOrProvider) as ${contract.name};
    }
  `.trim();
    return { header, body };
}
function generateFactoryConstructor(codegenConfig, contract, bytecode) {
    if (!bytecode.linkReferences) {
        return `
      constructor(...args: ${contract.name}ConstructorParams) {
        if (isSuperArgs(args)) {
          super(...args);
        } else {
          super(_abi, _bytecode, args[0]);
        }
        ${codegenConfig.discriminateTypes ? `this.contractName = '${contract.name}';` : ''}
      }
    `;
    }
    const linkRefReplacements = bytecode.linkReferences.map((linkRef) => {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
        // We're using a double escape backslash, since the string will be pasted into generated code.
        const escapedLinkRefRegex = linkRef.reference.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
        const libraryKey = linkRef.name || linkRef.reference;
        return `
      linkedBytecode = linkedBytecode.replace(
        new RegExp("${escapedLinkRefRegex}", "g"),
        linkLibraryAddresses["${libraryKey}"].replace(/^0x/, '').toLowerCase(),
      );`;
    });
    const className = `${contract.name}${common_1.FACTORY_POSTFIX}`;
    const libAddressesName = `${contract.name}LibraryAddresses`;
    return `
    constructor(
      ...args: ${contract.name}ConstructorParams
    ) {
      if (isSuperArgs(args)) {
        super (...args)
      } else {
        const [linkLibraryAddresses, signer] = args;
        super(
          _abi,
          ${className}.linkBytecode(linkLibraryAddresses),
          signer
        )
      }
      ${codegenConfig.discriminateTypes ? `this.contractName = '${contract.name}';` : ''}
    }

    static linkBytecode(linkLibraryAddresses: ${libAddressesName}): string {
      let linkedBytecode = _bytecode;
      ${linkRefReplacements.join('\n')}

      return linkedBytecode;
    }
  `;
}
function generateFactoryConstructorParamsAlias(contract, bytecode) {
    const name = `${contract.name}ConstructorParams`;
    if (bytecode.linkReferences) {
        return `
      type ${name} =
        | [linkLibraryAddresses: ${contract.name}LibraryAddresses, signer?: Signer]
        | ConstructorParameters<typeof ContractFactory>;

      const isSuperArgs = (
        xs: ${name}
      ): xs is ConstructorParameters<typeof ContractFactory> => {
        return typeof xs[0] === 'string'
          || (Array.isArray as (arg: any) => arg is readonly any[])(xs[0])
          || '_isInterface' in xs[0]
      }`;
    }
    else {
        return `
      type ${name} = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;

      const isSuperArgs = (xs: ${name}): xs is ConstructorParameters<typeof ContractFactory> =>
        xs.length > 1
    `;
    }
}
function generateLibraryAddressesInterface(contract, bytecode) {
    if (!bytecode.linkReferences)
        return '';
    const linkLibrariesKeys = bytecode.linkReferences.map((linkRef) => `    ["${linkRef.name || linkRef.reference}"]: string;`);
    return `
  export interface ${contract.name}LibraryAddresses {
    ${linkLibrariesKeys.join('\n')}
  };`;
}
/**
 * Instruments code generator based on the number of overloads and config flag.
 *
 * @param fns - overloads of the function
 * @param forceGenerateOverloads - flag to force generation of overloads.
 *        If set to true, full signatures will be used even if the function is not overloaded.
 * @param stringGen - function generating source code based on the declaration
 * @returns generated source code
 */
function processDeclaration(fns, forceGenerateOverloads, stringGen) {
    // Function is overloaded, we need unambiguous signatures
    if (fns.length > 1) {
        return fns.map((fn) => stringGen(fn, true));
    }
    return [stringGen(fns[0], false), forceGenerateOverloads && stringGen(fns[0], true)].filter(lodash_1.isString);
}
//# sourceMappingURL=index.js.map