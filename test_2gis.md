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
from google.colab import files
stat = 'launch_test_task.csv'
df = pd.read_csv(stat, sep=';')
user_stat = df.groupby(['platform']).agg(
    uniq_user = ('user_id', 'nunique'),
    count_sessions = ('session_id', 'count')
).reset_index()
user_stat.columns = ['Платформа', 'Уникальные пользователи', 'Кол-во сессий']
user_stat.to_csv('user_stat_result.csv', index = False, encoding = 'utf-8-sig')
files.download('user_stat_result.csv')
# Часть 2
stat_user_city = df.groupby('region').agg(
    u_count = ('user_id', 'nunique')
 ).reset_index()
stat_user_city = stat_user_city.sort_values(by='u_count', ascending=False)
stat_user_city.columns = ['Город', 'Количество пользователей']
stat_user_city.to_csv('stat_user_city_table.csv', index = False, encoding = 'utf-8-sig')
files.download('stat_user_city_table.csv')
```
## Задание 2*
```python
from datetime import datetime, timedelta
import pandas as pd
from airflow import DAG
from airflow.operators.python import PythonOperator

default_args = {
    'owner': 'Илья Никишин',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def process_launch_statistics(**kwargs):
    execution_date_str = kwargs['ds'] 
    execution_date = pd.to_datetime(execution_date_str).date()
    
    stat_path = 'launch_test_task.csv' 
    df = pd.read_csv(stat_path, sep=';')
    

    # Часть 1 (Платформы)
    user_stat = df.groupby(['platform']).agg(
        uniq_user=('user_id', 'nunique'),
        count_sessions=('session_id', 'count')
    ).reset_index()
    user_stat.columns = ['Платформа', 'Уникальные пользователи', 'Кол-во сессий']
    
    user_stat.to_csv('/opt/airflow/output/user_stat_result.csv', index=False, encoding='utf-8-sig')

    # Часть 2
    stat_user_city = df.groupby('region').agg(
        u_count=('user_id', 'nunique')
    ).reset_index()
    stat_user_city = stat_user_city.sort_values(by='u_count', ascending=False)
    stat_user_city.columns = ['Город', 'Количество пользователей']
    
    stat_user_city.to_csv('/opt/airflow/output/stat_user_city_table.csv', index=False, encoding='utf-8-sig')

with DAG(
    'launch_analytics_daily',
    default_args=default_args,
    description='Ежедневный расчет продуктовых метрик запусков приложения (исключая текущий день)',
    schedule_interval='0 1 * * *', 
    catchup=False,
) as dag:

    run_analytics = PythonOperator(
        task_id='calculate_metrics',
        python_callable=process_launch_statistics,
        provide_context=True,
    )

    run_analytics
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

