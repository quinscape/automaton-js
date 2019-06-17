# Custom Filter

A client-side custom filter can be defined by giving a function to `filter`.  

```js
<DataGrid.Column
    heading={ i18n("Sum") }
    filter={ (min,max) => (
        field("numa")
            .add(
                field(
                    "numb"
                )
            )
            .between(
                value(
                    "Int",
                    min
                ),
                value(
                    "Int",
                    max
                )
            )
    ) }
>
{
    (row) => row.sumA + row.sumB
}

The function can have one or more arguments.

</DataGrid.Column>


```
