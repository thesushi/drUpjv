<?php

/* themes/upjv/templates/node--article.html.twig */
class __TwigTemplate_81c894519e6164d68fa7a90f55a1f3e7acb9b12be160fe56e7bd3c5e9c1f1951 extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = array(
        );
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        $tags = array("if" => 1);
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('if'),
                array(),
                array()
            );
        } catch (Twig_Sandbox_SecurityError $e) {
            $e->setTemplateFile($this->getTemplateName());

            if ($e instanceof Twig_Sandbox_SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

        // line 1
        if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_pre", array()), 0, array())) {
            // line 2
            echo "    ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image_band", array()), 0, array())) {
                // line 3
                echo "        <div id=\"bandeau_visuel\">


            ";
                // line 6
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image_band", array()), 0, array()), "html", null, true));
                echo "
        </div>
    ";
            }
            // line 9
            echo "    <div id=\"page_deco\">

        <div id=\"avec_nav_sans_encadres\" class=\"contenu\">

            ";
            // line 13
            if ((isset($context["label"]) ? $context["label"] : null)) {
                // line 14
                echo "
                <h1>";
                // line 15
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["label"]) ? $context["label"] : null), "html", null, true));
                echo "</h1>
            ";
            }
            // line 17
            echo "

            <div>

                <p id=\"date\">Actualité le : ";
            // line 21
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_date_news", array()), 0, array()), "html", null, true));
            echo "</p>

                ";
            // line 23
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["content"]) ? $context["content"] : null), "body", array()), "html", null, true));
            echo "

            </div><!-- / -->


            ";
            // line 28
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_file_share", array()), 0, array())) {
                // line 29
                echo "                <div id=\"partage\">
                    <strong class=\"h2\">Partager</strong>
                    <ul id=\"boutons_actions\">
                        <li id=\"partage_pdf\">
                            <span class=\"fa fa-file\"></span>
                            ";
                // line 34
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_file_share", array()), 0, array()), "html", null, true));
                echo "
                        </li>
                    </ul>
                </div><!-- #partage -->
            ";
            }
            // line 39
            echo "
        </div>


        <div id=\"navigation\">

            <div id=\"rubrique_niveau_2\">
                ";
            // line 46
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_pre", array()), 0, array()), "html", null, true));
            echo "
            </div>

            ";
            // line 49
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array()), 0, array())) {
                // line 50
                echo "                <p>";
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array()), 0, array()), "html", null, true));
                echo " </p>
            ";
            }
            // line 52
            echo "

        </div>
    </div>
";
        }
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/node--article.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  134 => 52,  128 => 50,  126 => 49,  120 => 46,  111 => 39,  103 => 34,  96 => 29,  94 => 28,  86 => 23,  81 => 21,  75 => 17,  70 => 15,  67 => 14,  65 => 13,  59 => 9,  53 => 6,  48 => 3,  45 => 2,  43 => 1,);
    }
}
/* {% if content.field_pre.0 %}*/
/*     {% if content.field_image_band.0 %}*/
/*         <div id="bandeau_visuel">*/
/* */
/* */
/*             {{ content.field_image_band.0 }}*/
/*         </div>*/
/*     {% endif %}*/
/*     <div id="page_deco">*/
/* */
/*         <div id="avec_nav_sans_encadres" class="contenu">*/
/* */
/*             {% if label %}*/
/* */
/*                 <h1>{{ label }}</h1>*/
/*             {% endif %}*/
/* */
/* */
/*             <div>*/
/* */
/*                 <p id="date">Actualité le : {{ content.field_date_news.0 }}</p>*/
/* */
/*                 {{ content.body }}*/
/* */
/*             </div><!-- / -->*/
/* */
/* */
/*             {% if content.field_file_share.0 %}*/
/*                 <div id="partage">*/
/*                     <strong class="h2">Partager</strong>*/
/*                     <ul id="boutons_actions">*/
/*                         <li id="partage_pdf">*/
/*                             <span class="fa fa-file"></span>*/
/*                             {{ content.field_file_share.0 }}*/
/*                         </li>*/
/*                     </ul>*/
/*                 </div><!-- #partage -->*/
/*             {% endif %}*/
/* */
/*         </div>*/
/* */
/* */
/*         <div id="navigation">*/
/* */
/*             <div id="rubrique_niveau_2">*/
/*                 {{ content.field_pre.0 }}*/
/*             </div>*/
/* */
/*             {% if content.field_image.0 %}*/
/*                 <p>{{ content.field_image.0 }} </p>*/
/*             {% endif %}*/
/* */
/* */
/*         </div>*/
/*     </div>*/
/* {% endif %}*/
