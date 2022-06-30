---
title: Automaton Schema 
date: 2021-04-08
---

<section>
# Automaton Schema
This document explains the runtime schema reflection capabilities of Automaton.
</section>

<section>
## Runtime access

At runtime, the schema data is available via the `config.inputSchema`, separated into two parts:

 * `config.inputSchema.schema` contains the GraphQL introspection result providing the complete GraphQL schema in JSON format
 * `config.inputSchema.meta` contains additional extensible schema meta data  
</section>

<section>
## GraphQL Schema

The GraphQL schema data (`config.inputSchema.schema`) is the result of an introspection query run against the current automaton
instance. ( See de.quinscape.domainql.util.IntrospectionUtil ). The JSON data is a computer-readable view on the GraphQL view
and represents the exact same data as the `schema.graphql` field would, only in JSON.

`config.inputSchema.schema.types` contains an array of named type descriptors that make up the schema. The `kind` property
of each entry determines what kind of type is being declared
</section>

<section>
### Output Types 

An output type corresponds to a Java side JOOQ generated class or a handwritten POJO model (kind = "OBJECT").

property    | description
------------|-----------------------------------------------------------------
name        | Output type name
description | Description, either auto-generated or defined via type docs
fields | Array of field descriptors

Each entry in `fields` defines a GraphQL field

property    | description
------------|----------------------------------------------------------------
name        | Field name
description | Description, either auto-generated or defined via type docs
type        | Nested type descriptor. 

Let's take a look at a shortened version of the Foo type from automaton-test:

```json
{
    "kind": "OBJECT",
    "name": "Foo",
    "description": "Generic domain object. Used as target in datagrid-test. Generated from public.foo in the database dump.",
    "fields": [
        {
            "name": "name",
            "description": "DB column 'name'",
            "args": [],
            "type": {
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null
                }
            },
            "isDeprecated": false,
            "deprecationReason": null
        },
        {
            "name": "description",
            "description": "DB column 'description'",
            "args": [],
            "type": {
                "kind": "SCALAR",
                "name": "String",
                "ofType": null
            },
            "isDeprecated": false,
            "deprecationReason": null
        },
        {
            "name": "id",
            "description": "DB column 'id'",
            "args": [],
            "type": {
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null
                }
            },
            "isDeprecated": false,
            "deprecationReason": null
        },
        {
            "name": "ownerId",
            "description": "DB foreign key column 'owner_id'",
            "args": [],
            "type": {
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null
                }
            },
            "isDeprecated": false,
            "deprecationReason": null
        },
        {
            "name": "owner",
            "description": "Target of 'owner_id'",
            "args": [],
            "type": {
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "OBJECT",
                    "name": "AppUser",
                    "ofType": null
                }
            },
            "isDeprecated": false,
            "deprecationReason": null
        }
    ],
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
}
```
Each object in automaton has an id field plus the fields from the corresponding Java type plus additional fields from the relation definition.

Here, the `"owner"` field only exists because we defined a relation in [GraphQLConfiguration of automaton-test](https://github.com/quinscape/automaton-test/blob/master/src/main/java/de/quinscape/automatontest/runtime/config/GraphQLConfiguration.java#L107)

The type descriptor can be nested for non-null and/or list types.

property    | description
------------|----------------------------------------------------------------
kind        | Field type kind ("SCALAR", "NON_NULL", "LIST", "OBJECT")
name        | Field type name
description | Description, either auto-generated or defined via type docs
ofType      | For nested type descriptors like NON_NULL, contains another level of type descriptor
                                                                                                  
The nested type descriptors are needed to define types that would be something like `String!` or `[Int]!` in the schema.graphql.
</section>

<section>
### Input Types 

An input type corresponds to a Java side JOOQ generated class or a handwritten POJO model (kind = "INPUT_OBJECT").
The input type always corresponds to an output type. In automaton there might be a lot of input types missing because
that type never happens to be used as an input type and the editing functionality for it only be through generic automaton
base functions.
                                                                                                        
The JSON structure largely mirrors that of the output types, except for small differences

property    | description
------------|-----------------------------------------------------------------
name        | Output type name
description | Description, either auto-generated or defined via type docs
inputFields | Array of field descriptors

Each entry in `inputFields` defines a GraphQL field

property    | description
------------|----------------------------------------------------------------
name        | Field name
description | Description, either auto-generated or defined via type docs
type        | Nested type descriptor.

Let's take a look at a shortened version of the FooInput type from automaton-test:

```json
{
    "kind": "INPUT_OBJECT",
    "name": "FooInput",
    "description": "Generic domain object. Used as target in datagrid-test. Generated from public.foo in the database dump.",
    "fields": null,
    "inputFields": [
        {
            "name": "name",
            "description": null,
            "type": {
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null
                }
            },
            "defaultValue": null
        },
        {
            "name": "description",
            "description": null,
            "type": {
                "kind": "SCALAR",
                "name": "String",
                "ofType": null
            },
            "defaultValue": null
        },
        {
            "name": "id",
            "description": null,
            "type": {
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null
                }
            },
            "defaultValue": null
        },
        {
            "name": "ownerId",
            "description": null,
            "type": {
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null
                }
            },
            "defaultValue": null
        }
    ],
    "interfaces": null,
    "enumValues": null,
    "possibleTypes": null
}
```
Input types are always "flat", that is there can be no objects nested inside. There can be no `"owner" field here.

The type descriptor can be nested for non-null and/or list types.

property    | description
------------|----------------------------------------------------------------
kind        | Field type kind ("SCALAR", "NON_NULL", "LIST")
name        | Field type name
description | Description, either auto-generated or defined via type docs
ofType      | For nested type descriptors like NON_NULL, contains another level of type descriptor
</section>

<section>
### Enum Types 

The GraphQL enum type corresponds directly to a Java enum type. They're somewhat underrepresented in automaton because we 
tend to use full database types instead. 

property    | description
------------|-----------------------------------------------------------------
name        | Enum type name
description | Description, either auto-generated or defined via type docs
enumValues  | Array of enum value descriptors

Each entry in `enumValues` defines a valid value for that enum

property     | description
-------------|----------------------------------------------------------------
name         | Field name
description  | Description, either auto-generated or defined via type docs
isDeprecated | deprecation flag for the enum value

</section>
<section>
### Scalar Types 

The schema lists each GraphQL scalar type that is used within the schema including the special internal automaton scalar 
implementations.

</section>

<section>
## Metadata

Automaton provides an extensible metadata system that provides additional information about the Schema beyond what is
defined in the GraphQL schema.

property     | description
-------------|----------------------------------------------------------------
genericTypes | Generic type metadata addendum
relations    | Relation metadata addendum
types        | Type/field metadata (best accessed via the InputSchema API)
</section>
<section>
## InputSchema Metadata API

The InputSchema implementation of domainql-form includes methods to access the type metadata


</section>
<section>
### inputSchema.getTypeMeta(typeName, meta)

Provides access to the type level metadata for the given type and the given meta key. For example `"nameFields"` which
is an automaton standard type metadata field that defines which fields are representative for the entities of that type.

</section>
<section>
### inputSchema.getFieldMeta(typeName, fieldName, meta)

Provides access to the field level metadata for the given type, field and meta key. For example, `inputSchema.getFieldMeta("Foo", "name", "maxLength")`
provides the maximum field length of the corresponding database field. 

</section>
<section>
## Standard Automaton Metadata

By default, automaton provides the following metadata information.

On the type level:
    
 * "nameFields" : Array of a fields that are representative for that type

On the field level:

 * "maxLength" : Maximum field length in the underlying database
 * "decimalPrecision" : Precision and scale for Decimal fields
 * "computed" : Contains `true` for fields that are computed 

Automaton also provides two addendum properties: "genericTypes" and "relations"
</section>
<section>
### genericTypes

The genericTypes addendum (`config.inputSchema.meta.genericTypes`) contains an array of generic type references
(Mirrors the java type de.quinscape.domainql.GenericTypeReference)

property       | description
---------------|----------------------------------------------------------------
type           | GraphQL name of the de-generified type
genericType    | Fully qualified Java type this type is based on
typeParameters | Array of concrete type parameters used to construct this type 
                                                                              
For example this entry for the InteractiveQueryFoo type which was generated for the java type 
de.quinscape.automaton.model.data.InteractiveQuery&lt;Foo&gt; 
                                                                                                   
```json
{
    "type": "InteractiveQueryFoo",
    "genericType": "de.quinscape.automaton.model.data.InteractiveQuery",
    "typeParameters": [
        "Foo"
    ]
}
```
</section>
<section>
### relations

The relations addendum (`config.inputSchema.meta.relations`) contains an array of reference infos. These reflect the
relation configuration from the local GraphQLConfiguration. (A client side view on de.quinscape.domainql.config.RelationModel)

property            | description
--------------------|----------------------------------------------------------------
sourceType          | Source type containing the foreign key
sourceFields        | Foreign key fields on the source side
targetType          | Target type for the foreign key
targetFields        | Foreign key fields on the target side (Most commonly `["id"]`)
leftSideObjectName  | Relation field on the source side if applicable
rightSideObjectName | Relation field on the target side if applicable
sourceField         | Source field enum ("NONE", "SCALAR", "OBJECT", "OBJECT_AND_SCALAR")
targetField         | Target field enum ("NONE", "ONE", "MANY")
metaTags            | Array of relation meta tags (e.g. "ManyToMany" marks many-to-many relations on both sides)
id                  | Unique relation id

</section>
<section>
## Extending metadata

To add custom metadata for your application, you need to define a spring bean that implements de.quinscape.domainql.meta.MetadataProvider

```java
import de.quinscape.domainql.DomainQL;
import de.quinscape.domainql.meta.DomainQLMeta;
import de.quinscape.domainql.meta.DomainQLTypeMeta;
import de.quinscape.domainql.meta.MetadataProvider;

public class MyMetadataProvider
    implements MetadataProvider
{
    @Override
    public void provideMetaData(DomainQL domainQL, DomainQLMeta meta)
    {

        // Provide extra addendum
        meta.addAddendum("myAddendum", ...);

        final DomainQLTypeMeta typeMeta = meta.getTypeMeta("Foo");

        // provide type-level meta
        typeMeta.setMeta("typeMeta", ...);

        // provide field-level meta
        typeMeta.setFieldMeta("field", "fieldMeta", ...);
    }
}
```
The DomainQLMeta instance received can then be used to provide the extra metadata
</section>
