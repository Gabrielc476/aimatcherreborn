import sys
import os
import json
import asyncio
from jinja2 import Template
from playwright.async_api import async_playwright

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>Currículo Profissional</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            margin: 0;
            padding: 0;
            font-size: 10pt;
            line-height: 1.4;
            background-color: #ffffff;
        }
        
        .container {
            max-width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .name {
            font-size: 20pt;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        
        .title {
            font-size: 12pt;
            font-weight: bold;
            color: #333333;
            margin: 0 0 10px 0;
        }
        
        .contact-info {
            font-size: 9pt;
            color: #333333;
            margin-top: 5px;
        }
        
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 2px;
            margin-top: 20px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .summary {
            margin-bottom: 15px;
            font-size: 9.5pt;
            text-align: justify;
        }
        
        .experience-item, .project-item {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        
        .item-title {
            font-weight: bold;
            font-size: 10pt;
        }
        
        .item-description {
            margin-top: 4px;
            font-size: 9.5pt;
            text-align: justify;
        }
        
        .item-tech {
            font-size: 9pt;
            margin-top: 3px;
        }
        
        .skills-list {
            font-size: 9.5pt;
            margin-top: 5px;
        }
        
        @page {
            size: A4;
            margin: 20mm;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="name">{{ data.nome }}</h1>
            <div class="title">{{ data.titulo_profissional }}</div>
            <div class="contact-info">
                {% set contact_items = [] %}
                {% if data.email %}{% set _ = contact_items.append(data.email) %}{% endif %}
                {% if data.telefone %}{% set _ = contact_items.append(data.telefone) %}{% endif %}
                {% if data.localizacao %}{% set _ = contact_items.append(data.localizacao) %}{% endif %}
                {{ contact_items | join(' | ') }}
            </div>
        </div>

        {% if data.resumo_profissional %}
        <div class="section-title">Resumo Profissional</div>
        <div class="summary">
            {{ data.resumo_profissional }}
        </div>
        {% endif %}

        {% if data.experiencias %}
        <div class="section-title">Experiência Profissional</div>
        {% for exp in data.experiencias %}
        <div class="experience-item">
            <div class="item-title">
                {{ exp.cargo }}{% if exp.empresa %} - {{ exp.empresa }}{% endif %}{% if exp.periodo %} | {{ exp.periodo }}{% endif %}
            </div>
            {% if exp.descricao %}
            <div class="item-description">
                {{ exp.descricao }}
            </div>
            {% endif %}
            {% if exp.tecnologias_utilizadas %}
            <div class="item-tech">
                <strong>Tecnologias:</strong> {{ exp.tecnologias_utilizadas | join(', ') }}
            </div>
            {% endif %}
        </div>
        {% endfor %}
        {% endif %}

        {% if data.projetos %}
        <div class="section-title">Projetos Relevantes</div>
        {% for proj in data.projetos %}
        <div class="project-item">
            <div class="item-title">
                {{ proj.nome }}
            </div>
            {% if proj.descricao %}
            <div class="item-description">
                {{ proj.descricao }}
            </div>
            {% endif %}
            {% if proj.tecnologias %}
            <div class="item-tech">
                <strong>Tecnologias:</strong> {{ proj.tecnologias | join(', ') }}
            </div>
            {% endif %}
        </div>
        {% endfor %}
        {% endif %}

        {% if data.formacoes %}
        <div class="section-title">Formação Acadêmica</div>
        {% for form in data.formacoes %}
        <div class="experience-item" style="margin-bottom: 8px;">
            <div class="item-title">
                {{ form.curso }}{% if form.grau %} ({{ form.grau }}){% endif %}{% if form.instituicao %} - {{ form.instituicao }}{% endif %}{% if form.periodo %} | {{ form.periodo }}{% endif %}
            </div>
        </div>
        {% endfor %}
        {% endif %}

        {% if data.habilidades %}
        <div class="section-title">Habilidades & Competências</div>
        <div class="skills-list">
            <strong>Habilidades:</strong> {{ data.habilidades | join(', ') }}
        </div>
        {% endif %}

        {% if data.certificacoes %}
        <div class="section-title">Certificações</div>
        <div class="skills-list">
            {% for cert in data.certificacoes %}
            <div style="margin-bottom: 3px;">
                <strong>{{ cert.nome }}</strong>{% if cert.instituicao %} - {{ cert.instituicao }}{% endif %}{% if cert.dataEmissao %} | {{ cert.dataEmissao }}{% endif %}
            </div>
            {% endfor %}
        </div>
        {% endif %}

        {% if data.idiomas %}
        <div class="section-title">Idiomas</div>
        <div class="skills-list">
            {% set lang_list = [] %}
            {% for lang in data.idiomas %}
                {% if lang.nivelConversacao %}
                    {% set _ = lang_list.append(lang.nome ~ ' (' ~ lang.nivelConversacao ~ ')') %}
                {% else %}
                    {% set _ = lang_list.append(lang.nome) %}
                {% endif %}
            {% endfor %}
            {{ lang_list | join(' | ') }}
        </div>
        {% endif %}
    </div>
</body>
</html>
"""

async def generate_pdf(data_json_path, output_pdf_path):
    with open(data_json_path, 'r', encoding='utf-8') as f:
        resume_data = json.load(f)
    
    # Render using Jinja2 Template
    template = Template(HTML_TEMPLATE)
    html_content = template.render(data=resume_data)
    
    temp_html_path = data_json_path.replace('.json', '.html')
    with open(temp_html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Load file URL
        file_url = 'file://' + os.path.abspath(temp_html_path)
        await page.goto(file_url)
        await page.emulate_media(media="print")
        
        # Print to PDF using A4, with background colors enabled and standard margins
        await page.pdf(
            path=output_pdf_path,
            format="A4",
            print_background=True,
            margin={"top": "15mm", "bottom": "15mm", "left": "15mm", "right": "15mm"}
        )
        await browser.close()
        
    # Cleanup temp HTML
    if os.path.exists(temp_html_path):
        os.remove(temp_html_path)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python pdf_generator.py <data.json> <output.pdf>")
        sys.exit(1)
    
    json_path = sys.argv[1]
    pdf_path = sys.argv[2]
    
    asyncio.run(generate_pdf(json_path, pdf_path))
    print(f"PDF generated successfully at: {pdf_path}")
