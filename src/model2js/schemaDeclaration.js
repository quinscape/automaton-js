export const modelToJsSchema = {
    "properties":{
        "copyRights": {
            "type": "string"
        },
        "importDeclarations":{
            "type": "array",
            "items":{
                "type": ["object","null"],
                "properties":{
                    "type": {
                        "type": "string"
                    },
                    "source":{
                        "type" : "string"
                    },
                    "specifiers":{
                        "type": "array",
                        "minItems": 1,
                        "items":{
                            "type": "object",
                            "properties":{
                                "type": {
                                    "type": "string"
                                },
                                "name":{
                                    "type":"string"
                                },
                                "aliasOf":{
                                    "type":"string"
                                }
                            }
                        }
                    }
                }
            }
        },
        "domain":{
            "type":["object","null"],
            "properties":{
                "name":{
                    "type": "string"
                },
                "observables":{
                    "type": ["array","null"],
                    "items":{
                        "type": ["object","null"],
                        "properties":{
                            "name": {
                                "type": "string"
                            },
                            "defaultValue":{
                                "type":["string","null", "number"]
                            },
                            "description":{
                                "type":["string","null"]
                            }
                        }
                    }
                },
                "actions":{
                    "type": ["array","null"]
                },
                "computeds":{
                    "type": ["array","null"],
                    "items":{
                        "type": ["object","null"],
                        "properties":{
                            "name": {
                                "type": "string"
                            },
                            "code":{
                                "type":"string"
                            }
                        }
                    }
                },
                "helpers":{
                    "type": "array"
                },
            }
        },
        "query":{
            "type":["object","null"],
            "properties":{
                "query":{
                    "type": "string"
                },
                "variables":{
                    "type": ["object","null"],
                    "properties":{
                        "config":{
                            "type": ["object","null"],
                            "properties":{
                                "pageSize":{
                                    "type": ["number","null"]
                                }
                            }
                        }
                    }
                }
            }
        },
        "export":{
            "type":["string","null"]
        },
        "processExports":{
            "type":["object","null"],
            "properties":{
                "type":{
                    "type":"string"
                },
                "configuration":{
                    "type":["array","null"]
                },
                "process":{
                    "type":["object","null"],
                    "properties":{
                        "startState":{
                            "type":"string"
                        },
                        "states":{
                            "type":["object","null"]
                        }
                    }
                },
                "scope":{
                    "type":["object","null"],
                    "properties":{
                        "name":{
                            "type":"string"
                        },
                        "observables":{
                            "type":["array","null"],
                            "items":{
                                "type":["object","null"],
                                "properties":{
                                    "name":{
                                        "type":"string"
                                    },
                                    "defaultValue":{
                                        "type":["string","null"]
                                    }
                                }
                            }
                        },
                        "actions":{
                            "type":["array","null"],
                            "items":{
                                "type":["object","null"],
                                "properties":{
                                    "name":{
                                        "type":"string"
                                    },
                                    "params":{
                                        "type":["array","null"],
                                        "items":{
                                            "type":["string","null"]
                                        }
                                    },
                                    "code":{
                                        "type":["string","null"]
                                    },
                                    "bound":{
                                        "type":["boolean","null"]
                                    }
                                }
                            }
                        },
                        "computeds":{
                            "type":["array","null"]
                        },
                        "helpers":{
                            "type":["array","null"],
                            "items":{
                                "type":["object","null"],
                                "properties":{
                                    "name":{
                                        "type":"string"
                                    },
                                    "defaultValue":{
                                        "type":["string","null"]
                                    }
                                }
                            }
                        }
                    }
                },
                "extraConstants":{
                    "type":["array","null"],
                    "items":{
                        "type":["string","null"]
                    }
                }
            }
        },
        "states":{
            "type":["object","null"],
            "properties":{
                "type":{"type": "string" },
                "name":{"type": "string"},
                "transitionMap":{
                    "type":["object","null"],
                    "items":{
                        "type": ["object","null"]
                    }
                },
                "composite":{
                    "type":["object","null"],
                    "properties":{
                        "type":{
                            "type":"string"
                        },
                        "constants":{
                            "type":["array","null"],
                            "items":{
                                "type": ["object","null"],
                                "properties":{
                                    "type": {
                                        "type": "string"
                                    },
                                    "kind": {
                                        "type": "string"
                                    },
                                    "declarations":{
                                        "type": ["array","null"],
                                        "items":{
                                            "type": ["object","null"],
                                            "properties":{
                                                "type":{
                                                    "type":["string","null"]
                                                },
                                                "id": {
                                                    "type":["object","null"],
                                                    "properties":{
                                                        "type": {
                                                            "type": "string"
                                                        },
                                                        "name": {
                                                            "type": "string"
                                                        },
                                                        "properties": {
                                                            "type": ["array","null"],
                                                            "items":{
                                                                "type":["object","null"],
                                                                "properties":{
                                                                    "type":{
                                                                        "type":"string"
                                                                    },
                                                                    "key":{
                                                                        "type":"string"
                                                                    },
                                                                    "value":{
                                                                        "type":["object","null"],
                                                                        "properties":{
                                                                            "type": {
                                                                                "type": "string"
                                                                            },
                                                                            "name": {
                                                                                "type": "string"
                                                                            }
                                                                        }
                                                                    },
                                                                }
                                                            }
                                                        },
                                                    }
                                                },
                                                "init":{
                                                    "type":"string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "root":{
                            "type":["object","null"],
                            "properties":{
                                "type": {
                                    "type": "string"
                                },
                                "name":{
                                    "type":"string"
                                },
                                "attrs":{
                                    "type":["array","null"]
                                },
                                "kids":{
                                    "type":["array","null"],
                                    "items":{
                                        "type":["object","null"],
                                        "properties":{
                                            "name":{
                                                "type":"string"
                                            },
                                            "attrs":{
                                                "type":["array","null"],
                                                "items":{
                                                    "type":["object","null"],
                                                    "properties":{
                                                        "type":{
                                                            "type":"string"
                                                        },
                                                        "name":{
                                                            "type":"string"
                                                        },
                                                        "value":{
                                                            "type":["object","null"],
                                                            "properties":{
                                                                "type":{
                                                                    "type":["string","null"]
                                                                },
                                                                "code":{
                                                                    "type":["string","null"]
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            },
                                            "value":{
                                                "type":["string","null"]
                                            },
                                            "code":{
                                                "type":["string","null"]
                                            },
                                            "type":{
                                                "type":["string","null"]
                                            },
                                            "params":{
                                                "type":["array","null"],
                                                "items":{
                                                    "type":["object","null"],
                                                    "properties":{
                                                        "type":{
                                                            "type":"string"
                                                        },
                                                        "name":{
                                                            "type":"string"
                                                        },
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
    }
};