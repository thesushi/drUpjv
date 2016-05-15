<?php

/* themes/upjv/templates/views-view-fields--article_en_une.html.twig */
class __TwigTemplate_9bfb3a7a253d894a4fc33b362cdcde4c7dd1959d135fd405312ff2e2abd84b10 extends Twig_Template
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
        if ($this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "title", array()), "content", array())) {
            // line 2
            echo "    <li class=\"avec_vignette\"><!--          -->

    <div class=\"vignette_deco smallWidth\">

        ";
            // line 6
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_image", array()), "content", array()), "html", null, true));
            echo "

    </div>
    <!--         -->

    <div class=\"vignette_deco2\">
        <strong>";
            // line 12
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "title", array()), "content", array()), "html", null, true));
            echo "</strong>
        <div class=\"resume\">";
            // line 13
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_sous_titre", array()), "content", array()), "html", null, true));
            echo "</div>


        <!-- .resume --></div>
    <!-- .vignette_deco2   --></li>";
        }
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/views-view-fields--article_en_une.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  64 => 13,  60 => 12,  51 => 6,  45 => 2,  43 => 1,);
    }
}
/* {% if fields.title.content %}*/
/*     <li class="avec_vignette"><!--          -->*/
/* */
/*     <div class="vignette_deco smallWidth">*/
/* */
/*         {{ fields.field_image.content }}*/
/* */
/*     </div>*/
/*     <!--         -->*/
/* */
/*     <div class="vignette_deco2">*/
/*         <strong>{{ fields.title.content }}</strong>*/
/*         <div class="resume">{{ fields.field_sous_titre.content }}</div>*/
/* */
/* */
/*         <!-- .resume --></div>*/
/*     <!-- .vignette_deco2   --></li>{% endif %}*/
