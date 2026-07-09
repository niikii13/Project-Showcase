# Тестовое задание. Комания 2ГИС

### Автор: Илья Никишин

<br>

# Блок SQl
## Задание 1

```sql
SELECT 
(session_time::date - '2019-03-01'::date) as retation_date,
COUNT(DISTINCT(device_id))*100.0/(select 
    COUNT(DISTINCT(device_id))
    FROM retention_cohort) as retention_users
FROM retention_cohort

-- начинаем расчёт со второго дня
WHERE session_time >= '2019-03-02' and session_time <'2019-03-09'
GROUP BY retation_date
ORDER BY retation_date;
```

## Задание 2

```sql
WITH pretable AS (
    SELECT 
        DATE_TRUNC('month', SALE_DTTM) AS month_sale,
        CARD_NUMBER,
        -- Мы считаем расход пользователей, то есть фактические траты, поэтому вычитаем скидку
        SUM(PRICE * (1 - DISCOUNT / 100.0)) AS total_spent 
    FROM COFFEE_SALES
    GROUP BY DATE_TRUNC('month', SALE_DTTM), CARD_NUMBER
),

rank_table AS (
    SELECT month_sale,
    total_spent,
    ROW_NUMBER() OVER(PARTITION BY month_sale ORDER BY total_spent ASC) as rank_1_n,
    ROW_NUMBER() OVER(PARTITION BY month_sale ORDER BY total_spent DESC) as rank_n_1
    FROM pretable
)

SELECT 
    month_sale, 
    AVG(total_spent) as median_spending
FROM rank_table
WHERE ABS(rank_1_n-rank_n_1) <=1
GROUP BY month_sale
ORDER BY month_sale
```

# Блок Python
## Задание 1
```python
# Часть 1
import pandas as pd 
import numpy as np
stat = 'launch_test_task.csv'
df = pd.read_csv(stat)
user_stat = df.groupby(['source', 'platform']).agg(
    uniq_user = ('user_id', 'nunique'),
    count_sessions = ('session_id', 'count')
).reset_index()
user_stat.columns = ['Источники', 'Платформа', 'Уникальные пользователи', 'Кол-во сессий']
user_stat.to_csv('user_stat_result.csv', index = False, encoding = 'utf-8-sig')

# Часть 2
stat_user_city = df.groupby('region').agg(
    u_count = ('user_id', 'nunique')
 ).reset_index()
stat_user_city = stat_user_city.sort_values(by='u_count', ascending=False)
stat_user_city.columns = ['Город', 'Количество пользователей']
stat_user_city.to_csv('stat_user_city_table.csv', index = False, encoding = 'utf-8-sig')
```
## Задание 2*
```python
from datetime import datetime, timedelta
import pandas as pd
from airflow import DAG
from airflow.operators.python import PythonOperator

default_args = {
    'owner': 'data_analytics',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def generate_cumulative_reports(**kwargs):
    cutoff_date = kwargs['tomorrow_ds']
    print(f"Сбор данных за всю историю до: {kwargs['ds']} (включительно)")
    
    stat_path = '/path/to/your/data/launch_test_task.csv' 
    df = pd.read_csv(stat_path)
    
    df['date'] = pd.to_datetime(df['date'])
    
    df_filtered = df[df['date'] < pd.to_datetime(cutoff_date)].copy()
    
    if df_filtered.empty:
        print("Данные для расчета отсутствуют!")
        return "No data"

    output_dir = '/path/to/your/output/directory/'

    user_stat = df_filtered.groupby(['source', 'platform']).agg(
        uniq_user=('user_id', 'nunique'),
        count_sessions=('session_id', 'count')
    ).reset_index()
    user_stat.columns = ['Источники', 'Платформа', 'Уникальные пользователи', 'Кол-во сессий']
    user_stat.to_csv(f"{output_dir}user_stat_result.csv", index=False, encoding='utf-8-sig')

    stat_user_city = df_filtered.groupby('region').agg(
        u_count=('user_id', 'nunique')
    ).reset_index()
    stat_user_city = stat_user_city.sort_values(by='u_count', ascending=False)
    stat_user_city.columns = ['Город', 'Количество пользователей']
    stat_user_city.to_csv(f"{output_dir}stat_user_city_table.csv", index=False, encoding='utf-8-sig')
    
    print("Файлы user_stat_result.csv и stat_user_city_table.csv успешно обновлены.")

with DAG(
    'marketing_cumulative_reports',
    default_args=default_args,
    description='Ежедневное обновление кумулятивных отчетов до вчерашнего дня',
    schedule_interval='0 3 * * *',
    start_date=datetime(2026, 7, 1),
    catchup=False,                  
    max_active_runs=1,
) as dag:

    run_report = PythonOperator(
        task_id='generate_cumulative_reports',
        python_callable=generate_cumulative_reports,
    )
```

# Блок A/B тесты
## Задание 1
```python
import statsmodels.api as sm 
buyers_2, recipient_2 = 745, 6076
buyers_1, recipient_1 = 621, 6076
res= sm.stats.proportions_ztest(
    count = [buyers_2, buyers_1],
    nobs = [recipient_2, recipient_1],
    alternative = 'two-sided'
)

print(f"Z-статистика: {res[0]:.4f}")
print(f"p=value: {res[1]:.5f}")
```
> ### Результаты эксперимента и вывод:
> * **Z-статистика:** `3.5611`
> * **p-value:** `0.00037` (меньше порогового уровня 0.05)
>
> **Вывод:** Разница в конверсиях статистически значима. Новый алгоритм рассылки показал себя успешно, рост составил **2,04%**.

