
<section>
### Example
```js
    // language=GraphQL
    const myMutation = new GraphQLQuery(`
        mutation myMutation($fooo: String!){
            myMutation(foo: $foo)
        }`
    );

```

We most commonly use the declarative variant [graphql](/misc/#graphql) to enable data injection.

</section>

