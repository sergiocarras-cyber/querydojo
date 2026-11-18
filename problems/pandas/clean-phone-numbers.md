---
id: pandas-003
slug: clean-phone-numbers
title: Clean Phone Numbers
section: pandas
difficulty: Easy
topics: [Data cleaning, str methods, Regex]
company: Moviq Rides
function: clean_phones
---

## Statement

Driver phone numbers at **Moviq Rides** were typed by hand. Normalise them to a plain
**10-digit** US number:

1. Remove every character that is not a digit.
2. If the result has 11 digits and starts with `1` (country code), drop that leading `1`.
3. Keep only contacts whose cleaned number has exactly 10 digits (others are invalid, as are
   missing phones).

Return `contact_id` and `phone` (the cleaned string). Row order doesn't matter.

```python
def clean_phones(contacts: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def clean_phones(contacts: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return contacts
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "contact_id": [1, 2, 3, 4, 5],
        "phone": ["(555) 010-2233", "555.010.4477", "+1 555 010 9001", "12345", None],
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "contact_id": [10, 11, 12, 13, 14, 15],
        "phone": ["1-555-010-1111", "2555010111", "25550101112", "555 010 2222 ext", "phone: 5550103333", "1-155-501-0111"],
    })]
```

## Hints

### Hint 1

`series.str.replace(r"\D", "", regex=True)` deletes non-digits.

### Hint 2

Combine `str.len() == 11` and `str.startswith("1")` to find numbers with a country code, then
`str[1:]` drops the first character.

## Solution

```python
import pandas as pd

def clean_phones(contacts: pd.DataFrame) -> pd.DataFrame:
    digits = contacts["phone"].str.replace(r"\D", "", regex=True)
    has_code = (digits.str.len() == 11) & digits.str.startswith("1")
    digits = digits.where(~has_code, digits.str[1:])
    out = contacts.assign(phone=digits)
    out = out[out["phone"].str.len() == 10]
    return out[["contact_id", "phone"]].reset_index(drop=True)
```

## Explanation

1. `\D` matches any non-digit; replacing it with `""` leaves only digits. Missing phones stay
   missing (`NaN`), and `NaN` comparisons are `False`, so they are filtered out later.
2. `where(cond, other)` keeps values where `cond` is true and uses `other` elsewhere: here,
   numbers with a leading country code lose their first digit.
3. Filtering on length 10 removes everything invalid.

Vectorised `str` methods are much faster than `apply` with a Python function on large frames.

## Wrong Answers

### Country code not removed

Numbers written with the leading `1` have 11 digits and get filtered out. Drop the first digit when there are 11 digits starting with `1`.

```python
import pandas as pd

def clean_phones(contacts):
    digits = contacts["phone"].str.replace(r"\D", "", regex=True)
    out = contacts.assign(phone=digits)
    return out[out["phone"].str.len() == 10][["contact_id", "phone"]]
```

### `lstrip('1')` removes too much

`lstrip` removes every leading `1`, so a 10-digit number starting with 1 loses a digit too. Remove exactly one leading `1`, and only from 11-digit numbers.

```python
import pandas as pd

def clean_phones(contacts):
    digits = contacts["phone"].str.replace(r"\D", "", regex=True).str.lstrip("1")
    out = contacts.assign(phone=digits)
    return out[out["phone"].str.len() == 10][["contact_id", "phone"]]
```
