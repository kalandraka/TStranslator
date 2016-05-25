/// <reference path="typings/node/node.d.ts" />

import * as ts from "typescript";
import * as fs from "fs";

var lastSyntaxKind = -1;
var argumentIndex = 0;

var LiteralKeywords = {
    110: "private",
    111: "protected",
    112: "public",
    113: "static",
    115: "abstract",
};

var TypeKeywords = {
    117: "dynamic",
    131: "object",
    128: "double",
    120: "bool",
    130: "string",
    103: "void",
};

var CSKeywords =
    {
        "abstract": true, "as": true, "base": true, "bool": true, "break": true,
        "byte": true, "case": true, "catch": true, "char": true, "checked": true,
        "class": true, "const": true, "continue": true, "decimal": true, "default": true,
        "delegate": true, "do": true, "double": true, "else": true, "enum": true,
        "event": true, "explicit": true, "extern": true, "false": true, "finally": true,
        "fixed": true, "float": true, "for": true, "foreach": true, "goto": true,
        "if": true, "implicit": true, "in": true, "int": true, "interface": true,
        "internal": true, "is": true, "lock": true, "long": true, "namespace": true,
        "new": true, "null": true, "object": true, "operator": true, "out": true,
        "override": true, "params": true, "private": true, "protected": true, "public": true,
        "readonly": true, "ref": true, "return": true, "sbyte": true, "sealed": true,
        "short": true, "sizeof": true, "stackalloc": true, "static": true, "string": true,
        "struct": true, "switch": true, "this": true, "throw": true, "true": true,
        "try": true, "typeof": true, "uint": true, "ulong": true, "unchecked": true,
        "unsafe": true, "ushort": true, "using": true, "virtual": true, "void": true,
        "volatile": true, "while": true
    };

function generateDefinitions(fileNames: string[], options: ts.CompilerOptions): void {    
    let program = ts.createProgram(fileNames, options);    
    let checker = program.getTypeChecker();
    let output = "";
    for (const sourceFile of program.getSourceFiles()) {
        ts.forEachChild(sourceFile, sourceFile => visit(sourceFile, null));        
        fs.writeFileSync(sourceFile.fileName + ".cs", output);
    }
    return;

    function visit(node: ts.Node, parentSymbol: ts.Symbol) {
        switch (node.kind) {
            case ts.SyntaxKind.PropertyDeclaration:
                let prop_symbol = checker.getSymbolAtLocation((<ts.PropertyDeclaration>node).name);
                ts.forEachChild(node, visitPreIdentifier);
                if ((<ts.PropertyDeclaration>node).type == undefined)
                    output += "dynamic ";
                output += " " + prop_symbol.getName();
                if (CSKeywords[prop_symbol.getName()])
                {
                    output += "__";
                }
                output += ";\n";
                break;
            case ts.SyntaxKind.PropertySignature:
                let sign_symbol = checker.getSymbolAtLocation((<ts.PropertySignature>node).name);
                ts.forEachChild(node, visitPreIdentifier);
                if ((<ts.PropertyDeclaration>node).type == undefined)
                    output += "dynamic ";
                output += " " + sign_symbol.getName();
                if (CSKeywords[sign_symbol.getName()]) {
                    output += "__";
                }
                output += ";\n";
                break;
            case ts.SyntaxKind.MethodDeclaration:
                let method_symbol = checker.getSymbolAtLocation((<ts.MethodDeclaration>node).name);
                ts.forEachChild(node, visitPreIdentifier);
                output += " " + method_symbol.getName();
                if (CSKeywords[method_symbol.getName()]) {
                    output += "__";
                }
                output += "(";                    
                ts.forEachChild(node, visitMethodArguments);
                output += "); \n";
                argumentIndex = 0;
                break;
            case ts.SyntaxKind.Constructor:
                output += "public " + parentSymbol.getName();
                if (CSKeywords[parentSymbol.getName()]) {
                    output += "__";
                }
                output += "("; 
                ts.forEachChild(node, visitMethodArguments);
                argumentIndex = 0;
                output += ");\n"
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                let interface_symbol = checker.getSymbolAtLocation((<ts.InterfaceDeclaration>node).name);
                output += "interface " + interface_symbol.getName();
                if (CSKeywords[interface_symbol.getName()]) {
                    output += "__";
                }               
                ts.forEachChild(node, visitPostIdentifier);
                argumentIndex = 0;
                output += "\n{ \n";
                ts.forEachChild(node, node => visit(node, interface_symbol));
                output += "\n} \n";
                break;
            case ts.SyntaxKind.ClassDeclaration:
                let class_symbol = checker.getSymbolAtLocation((<ts.ClassDeclaration>node).name);
                output += "class " + class_symbol.getName();
                if (CSKeywords[class_symbol.getName()]) {
                    output += "__";
                }   
                ts.forEachChild(node, visitPostIdentifier);
                argumentIndex = 0;
                output += "\n{ \n";
                ts.forEachChild(node, node => visit(node, class_symbol));
                output += "\n} \n";
                break;
            case ts.SyntaxKind.ModuleDeclaration:
                let namespace_symbol = checker.getSymbolAtLocation((<ts.ModuleDeclaration>node).name);
                output += "namespace " + namespace_symbol.getName();
                if (CSKeywords[namespace_symbol.getName()]) {
                    output += "__";
                }
                output += "\n{ \n"; 
                ts.forEachChild(node, node => visit(node, namespace_symbol));
                output += "\n} \n";
                break;
            case ts.SyntaxKind.ModuleBlock:
                ts.forEachChild(node, node => visit(node, parentSymbol));
                break;
        }
    }

    function visitPreIdentifier(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.QualifiedName:
                output += node.getText();                   
                break;
            case ts.SyntaxKind.ArrayType:
                ts.forEachChild(node, visitPreIdentifier);
                output += "[]";
                break;
            case ts.SyntaxKind.TypeReference:
                let type_symbol = checker.getSymbolAtLocation((<ts.TypeReferenceNode>node).typeName);
                if (type_symbol) {
                    output += type_symbol.getName();
                }
                ts.forEachChild(node, visitPreIdentifier);
                break;
            case ts.SyntaxKind.TypeLiteral:
                output += "dynamic";               
                argumentIndex = 0;
                break;      
            case ts.SyntaxKind.UnionType:
                output += "dynamic";
                argumentIndex = 0;
                break;       
            default:                             
                if (LiteralKeywords[node.kind]) {
                    output += LiteralKeywords[node.kind] + " ";
                }
                if (TypeKeywords[node.kind]) {
                    output += TypeKeywords[node.kind];
                }
                break;
        }
        lastSyntaxKind = node.kind;
    }

    function visitPostIdentifier(node: ts.Node) {        
        switch (node.kind) {
            case ts.SyntaxKind.HeritageClause:
                if (argumentIndex == 0)
                    output += ": ";
                ts.forEachChild(node, visitHeritageArguments);
                break;
        }
        lastSyntaxKind = node.kind;
    }

    function visitHeritageArguments(node: ts.Node) {        
        switch (node.kind) {
            case ts.SyntaxKind.ExpressionWithTypeArguments:
                if (argumentIndex > 0)
                    output += ", ";
                ts.forEachChild(node, visitHeritageArguments);
                break;
            case ts.SyntaxKind.Identifier:
                argumentIndex += 1;
                output += node.getText();
                if (CSKeywords[node.getText()]) {
                    output += "__";
                }
                break;
        }
        lastSyntaxKind = node.kind;
    }

    function visitMethodArguments(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.Parameter:
                if (argumentIndex > 0)
                    output += ", ";
                argumentIndex += 1;
                let param_symbol = checker.getSymbolAtLocation((<ts.TypeParameterDeclaration>node).name);
                ts.forEachChild(node, visitPreIdentifier);
                output += " " + param_symbol.getName();
                if (CSKeywords[param_symbol.getName()]) {
                    output += "__";
                }
                break;
        }
        lastSyntaxKind = node.kind;
    }
}

generateDefinitions(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
});