import pandas as pd
import numpy as np
import panel as pn
pn.extension('tabulator')

import hvplot.pandas


     

if 'data' not in pn.state.cache.keys():
    df = pd.read_csv('https://raw.githubusercontent.com/WillBallentine/cov_dashboard/main/United_States_COVID-19_Cases_and_Deaths_by_State_over_Time_-_ARCHIVED.csv')
    pn.state.cache['data'] = df.copy()
    
else:
    df = pn.state.cache['data']
    


#Variable set for radial buttons
df['submission_date'] = pd.to_datetime(df['submission_date'])
df['year'] = pd.DatetimeIndex(df['submission_date']).year
df['month'] = pd.DatetimeIndex(df['submission_date']).month

months = set(pd.DatetimeIndex(df['submission_date']).month)
years = set(pd.DatetimeIndex(df['submission_date']).year)
year = []
for i in years:
    year.append(i)
    
month = []
for i in months:
    month.append(i)


     

df = df.fillna(0)


     

idf = df.interactive()


     

#Define panel widgets
state_case_select = pn.widgets.Select(name="State Select",  options=['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'], inline=False)
state_death_select = pn.widgets.Select(name="State Select", options=['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'], inline=False)
state_case_select
state_death_select


     

#define radial buttons for charts
month_case_select = pn.widgets.RadioButtonGroup(
    name='Month', 
    options=month,
    button_type='success'
)

year_case_select = pn.widgets.RadioButtonGroup(
    name='Year',
    options=year,
    button_type='success'
)

month_death_select = pn.widgets.RadioButtonGroup(
    name='Month', 
    options=month,
    button_type='success'
)

year_death_select = pn.widgets.RadioButtonGroup(
    name='Year',
    options=year,
    button_type='success'
)


     

tot_case_pipeline = (idf[((idf.state) == state_case_select) & ((idf.month) == month_case_select) & ((idf.year) == year_case_select)])


     

tot_deaths_pipeline = (idf[((idf.state) == state_death_select) & ((idf.month) == month_death_select) & ((idf.year) == year_death_select)])


     

tot_case_pipeline


     

tot_deaths_pipeline


     

tot_plot = tot_case_pipeline.hvplot(kind='scatter', x='submission_date', by='state', y='tot_cases', title="Total Cases by state", color='red', height= 500, width=500, size=60)
tot_plot


     

deaths_scatterplot = tot_deaths_pipeline.hvplot(x='submission_date', y='tot_death', size=60, kind="scatter", height = 500, width=500, title="Total Deaths by State")
deaths_scatterplot


     

#avg_death_pipeline = (idf[(idf.state) == state_select])


     

#Layout using Template
template = pn.template.FastListTemplate(
    title='Covid Cases by State', 
    sidebar=[pn.pane.Markdown("# Covid-19 Cases by State Reports"), 
             pn.pane.Markdown("#### Covid, while largely under conrol, had a massive impact on our States over the last three years."), 
             pn.pane.PNG('covid.png', width=200, height=100),
             pn.pane.Markdown("## Select State"),   
             ],
    main=[pn.Row(pn.Column(month_case_select, year_case_select, state_case_select,
                           tot_plot.panel(width=900), margin=(0,25)),
                 (pn.Column(month_death_select, year_death_select, state_death_select,
                 deaths_scatterplot.panel(width=900), margin=(0,25)))), 
],
    accent_base_color="#88d8b0",
    header_background="#88d8b0",
)
# template.show()
template.servable();
