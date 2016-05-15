<?php

/* themes/upjv/templates/node--page_404.html.twig */
class __TwigTemplate_e11ee107a80eea433a5736d8985a316419ceff23f49ccb5ef98be72a40ad55fe extends Twig_Template
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
        $tags = array("if" => 15);
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
        echo "
    <div id=\"page_deco\" class=\" error-page\">

        <div id=\"avec_nav_sans_encadres\" class=\"contenu\">

                <h1>";
        // line 6
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["label"]) ? $context["label"] : null), "html", null, true));
        echo "</h1>
            <div>

                <div class=\"ligne_1\">

                    <div class=\"colonne_1 fullWidth\">
                        <div class=\"colonne_deco\">
                        <div class=\"centeredText\">

                        ";
        // line 15
        if ($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array())) {
            // line 16
            echo "                        <div class=\"style_4\">
                        <h2> ";
            // line 17
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array()), 0, array()), "html", null, true));
            echo " </h2>
                        </div>
                        ";
        }
        // line 20
        echo "                       

                        ";
        // line 22
        if ($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array())) {
            // line 23
            echo "                        ";
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array()), 0, array()), "html", null, true));
            echo "
                        ";
        }
        // line 25
        echo "
                        ";
        // line 26
        if ($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_li", array())) {
            // line 27
            echo "                        <div class=\"style_3\">
                        ";
            // line 28
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_li", array()), 0, array()), "html", null, true));
            echo "
                        ";
        }
        // line 30
        echo "                        </div>
                            </div>

                        </div><!-- colonne_deco -->
                        
                        
                    </div><!-- .colonne_1 -->


                </div><!-- .ligne_1 -->


            </div><!-- / -->

        </div>

    </div>
";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/node--page_404.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  98 => 30,  93 => 28,  90 => 27,  88 => 26,  85 => 25,  79 => 23,  77 => 22,  73 => 20,  67 => 17,  64 => 16,  62 => 15,  50 => 6,  43 => 1,);
    }
}
/* */
/*     <div id="page_deco" class=" error-page">*/
/* */
/*         <div id="avec_nav_sans_encadres" class="contenu">*/
/* */
/*                 <h1>{{ label }}</h1>*/
/*             <div>*/
/* */
/*                 <div class="ligne_1">*/
/* */
/*                     <div class="colonne_1 fullWidth">*/
/*                         <div class="colonne_deco">*/
/*                         <div class="centeredText">*/
/* */
/*                         {% if content.field_sous_titre %}*/
/*                         <div class="style_4">*/
/*                         <h2> {{ content.field_sous_titre.0 }} </h2>*/
/*                         </div>*/
/*                         {% endif %}*/
/*                        */
/* */
/*                         {% if content.field_image %}*/
/*                         {{ content.field_image.0 }}*/
/*                         {% endif %}*/
/* */
/*                         {% if content.field_li %}*/
/*                         <div class="style_3">*/
/*                         {{ content.field_li.0 }}*/
/*                         {% endif %}*/
/*                         </div>*/
/*                             </div>*/
/* */
/*                         </div><!-- colonne_deco -->*/
/*                         */
/*                         */
/*                     </div><!-- .colonne_1 -->*/
/* */
/* */
/*                 </div><!-- .ligne_1 -->*/
/* */
/* */
/*             </div><!-- / -->*/
/* */
/*         </div>*/
/* */
/*     </div>*/
/* */
