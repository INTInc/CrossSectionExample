module.exports = {
    "parserOptions": {
        "ecmaVersion": 2017,
        "sourceType": "node"
    },
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "ecmaFeatures": {
        "arrowFunctions": true,
        "blockBindings": true,
        "classes": true,
        "defaultParameters": true,
        "destructuring": true,
        "forOf": true,
        "generators": true,
        "modules": true,
        "objectLiteralComputedProperties": true,
        "objectLiteralDuplicateProperties": true,
        "objectLiteralShorthandMethods": true,
        "objectLiteralShorthandProperties": true,
        "regexUFlag": true,
        "regexYFlag": true,
        "restParams": true,
        "spread": true,
        "superInFunctions": true,
        "templateStrings": true,
        "unicodeCodePointEscapes": true,
        "globalReturn": true
    },
    "extends": "google",
    "rules": {
        'max-params': [1, 6],
        'max-len': [2, {
            code: 140,
            ignoreComments: true
        }],
        'indent': [2, 4, {'SwitchCase': 1}]
    }
};
