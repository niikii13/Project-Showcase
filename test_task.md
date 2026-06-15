# Блок 1

## Задание 1

**Ответ:** `3.99`

## Задание 2

**Ответ:** `20`

## Задание 3

- Для 10 минут вероятность ≈ **63%**
- Для 27 минут вероятность ≈ **93%**

---

# Блок 2

## Задание 1

```python
def is_isomorphic(s, t):
    if len(s) != len(t):
        return False

    s_to_t = {}
    t_to_s = {}

    for cs, ct in zip(s, t):
        if cs in s_to_t:
            if s_to_t[cs] != ct:
                return False
        else:
            if ct in t_to_s:
                return False

            s_to_t[cs] = ct
            t_to_s[ct] = cs

    return True
```

## Задание 2

```python
def missing_number(nums):
    n = len(nums) + 1
    expected = n * (n + 1) // 2
    return expected - sum(nums)

nums = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]
print(missing_number(nums))
```

## Задание 3

```python
def prime_factors(n):
    factors = []
    d = 2

    while d * d <= n:
        while n % d == 0:
            factors.append(d)
            n //= d
        d += 1

    if n > 1:
        factors.append(n)

    return factors
```

---

# Блок 3

## Задание 1

```sql
SELECT
    id,
    scores,
    DENSE_RANK() OVER (ORDER BY scores DESC) AS rank
FROM examination
ORDER BY rank;
```

## Задание 2

- Минимум: **30**
- Максимум: **50**

## Задание 3

```sql
SELECT a.client_id
FROM account a
JOIN transaction t ON a.id = t.account_id
WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 month'
GROUP BY a.client_id
HAVING SUM(amount) < 5000;
```

---

# Блок 4

## Задание 1

Верные ответы:

- 3
- 4

## Задание 2

**Ответ:** `2`

## Задание 3

Можно применить **t-критерий**, так как объём выборки достаточно большой и отсутствуют значительные выбросы. При таком количестве наблюдений начинает эффективно работать теория больших чисел, что позволяет получить статистически надёжный и наиболее вероятный результат.

---

# Блок 5

## Задание 1

Для решения задачи стоит использовать две модели:

1. Первая модель будет основной и использоваться для получения итогового результата.
2. Вторая модель может применяться как вспомогательная, однако необходимо учитывать, что она часто выдаёт некорректные результаты.

Поэтому данные второй модели можно использовать после инверсии её предсказаний (из 1 вычитать полученное значение). Затем результаты обеих моделей сравниваются, после чего выбирается наиболее качественное решение.

## Задание 2

**Ответ:** `0.75`

## Задание 3

**Ответ:** `-0.85`
