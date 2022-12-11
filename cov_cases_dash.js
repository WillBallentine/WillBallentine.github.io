importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js");

function sendPatch(patch, buffers, msg_id) {
  self.postMessage({
    type: 'patch',
    patch: patch,
    buffers: buffers
  })
}

async function startApplication() {
  console.log("Loading pyodide!");
  self.postMessage({type: 'status', msg: 'Loading pyodide'})
  self.pyodide = await loadPyodide();
  self.pyodide.globals.set("sendPatch", sendPatch);
  console.log("Loaded!");
  await self.pyodide.loadPackage("micropip");
  const env_spec = ['https://cdn.holoviz.org/panel/0.14.1/dist/wheels/bokeh-2.4.3-py3-none-any.whl', 'https://cdn.holoviz.org/panel/0.14.1/dist/wheels/panel-0.14.1-py3-none-any.whl', 'pyodide-http==0.1.0', 'holoviews>=1.15.1', 'hvplot', 'numpy', 'pandas']
  for (const pkg of env_spec) {
    let pkg_name;
    if (pkg.endsWith('.whl')) {
      pkg_name = pkg.split('/').slice(-1)[0].split('-')[0]
    } else {
      pkg_name = pkg
    }
    self.postMessage({type: 'status', msg: `Installing ${pkg_name}`})
    try {
      await self.pyodide.runPythonAsync(`
        import micropip
        await micropip.install('${pkg}');
      `);
    } catch(e) {
      console.log(e)
      self.postMessage({
	type: 'status',
	msg: `Error while installing ${pkg_name}`
      });
    }
  }
  console.log("Packages loaded!");
  self.postMessage({type: 'status', msg: 'Executing code'})
  const code = `
  
import asyncio

from panel.io.pyodide import init_doc, write_doc

init_doc()

#!/usr/bin/env python
# coding: utf-8

# In[14]:


import pandas as pd
import numpy as np
import panel as pn
pn.extension('tabulator')

import hvplot.pandas


# In[15]:


if 'data' not in pn.state.cache.keys():
    df = pd.read_csv('https://raw.githubusercontent.com/WillBallentine/cov_dashboard/main/United_States_COVID-19_Cases_and_Deaths_by_State_over_Time_-_ARCHIVED.csv')
    pn.state.cache['data'] = df.copy()
    
else:
    df = pn.state.cache['data']
    
df


# In[13]:


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


# In[ ]:


df = df.fillna(0)


# In[ ]:


idf = df.interactive()


# In[ ]:


#Define panel widgets
state_case_select = pn.widgets.Select(name="State Select",  options=['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'], inline=False)
state_death_select = pn.widgets.Select(name="State Select", options=['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'], inline=False)
state_case_select
state_death_select


# In[ ]:


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


# In[ ]:


tot_case_pipeline = (idf[((idf.state) == state_case_select) & ((idf.month) == month_case_select) & ((idf.year) == year_case_select)])


# In[ ]:


tot_deaths_pipeline = (idf[((idf.state) == state_death_select) & ((idf.month) == month_death_select) & ((idf.year) == year_death_select)])


# In[ ]:


tot_case_pipeline


# In[ ]:


tot_deaths_pipeline


# In[ ]:


tot_plot = tot_case_pipeline.hvplot(kind='scatter', x='submission_date', by='state', y='tot_cases', title="Total Cases by state", color='red', height= 500, width=500, size=60)
tot_plot


# In[ ]:


deaths_scatterplot = tot_deaths_pipeline.hvplot(x='submission_date', y='tot_death', size=60, kind="scatter", height = 500, width=500, title="Total Deaths by State")
deaths_scatterplot


# In[ ]:


#avg_death_pipeline = (idf[(idf.state) == state_select])


# In[ ]:


#Layout using Template
template = pn.template.FastListTemplate(
    title='Covid Cases by State', 
    sidebar=[pn.pane.Markdown("# Covid-19 Cases by State Reports"), 
             pn.pane.Markdown("#### Covid, while largely under conrol, had a massive impact on our States over the last three years."),    
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


# In[ ]:






await write_doc()
  `

  try {
    const [docs_json, render_items, root_ids] = await self.pyodide.runPythonAsync(code)
    self.postMessage({
      type: 'render',
      docs_json: docs_json,
      render_items: render_items,
      root_ids: root_ids
    })
  } catch(e) {
    const traceback = `${e}`
    const tblines = traceback.split('\n')
    self.postMessage({
      type: 'status',
      msg: tblines[tblines.length-2]
    });
    throw e
  }
}

self.onmessage = async (event) => {
  const msg = event.data
  if (msg.type === 'rendered') {
    self.pyodide.runPythonAsync(`
    from panel.io.state import state
    from panel.io.pyodide import _link_docs_worker

    _link_docs_worker(state.curdoc, sendPatch, setter='js')
    `)
  } else if (msg.type === 'patch') {
    self.pyodide.runPythonAsync(`
    import json

    state.curdoc.apply_json_patch(json.loads('${msg.patch}'), setter='js')
    `)
    self.postMessage({type: 'idle'})
  } else if (msg.type === 'location') {
    self.pyodide.runPythonAsync(`
    import json
    from panel.io.state import state
    from panel.util import edit_readonly
    if state.location:
        loc_data = json.loads("""${msg.location}""")
        with edit_readonly(state.location):
            state.location.param.update({
                k: v for k, v in loc_data.items() if k in state.location.param
            })
    `)
  }
}

startApplication()