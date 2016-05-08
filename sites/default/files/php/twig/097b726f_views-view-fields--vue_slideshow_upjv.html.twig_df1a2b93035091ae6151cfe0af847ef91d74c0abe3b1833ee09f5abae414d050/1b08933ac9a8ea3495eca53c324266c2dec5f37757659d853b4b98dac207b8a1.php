<?php

/* themes/upjv/templates/views-view-fields--vue_slideshow_upjv.html.twig */
class __TwigTemplate_58b183273094cf14d861fde334fed893aeef6b6a1d7e55d3e209070bb4bfea09 extends Twig_Template
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
        $tags = array("if" => 2);
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
";
        // line 2
        if ( !(null === $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "title", array()), "content", array()))) {
            // line 3
            echo "

    <div data-p=\"172.50\" class=\"sliderDiv\" >
        ";
            // line 6
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_image", array()), "content", array()), "html", null, true));
            echo "
        <div class=\"newSlideJssor\">


            <span class=\"typeDisplayTitre\">";
            // line 10
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "title", array()), "content", array()), "html", null, true));
            echo "</span>
            <br>
            ";
            // line 12
            if ( !(null === $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_sous_titre", array()), "content", array()))) {
                // line 13
                echo "                <span class=\"typeDisplaySousTitre\">";
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_sous_titre", array()), "content", array()), "html", null, true));
                echo "</span>
            ";
            }
            // line 15
            echo "    ";
            if ( !(null === $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_url", array()), "content", array()))) {
                // line 16
                echo "            <a href=\"";
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_url", array()), "content", array()), "html", null, true));
                echo "\" class=\"righted\">

                 ";
                // line 18
                if ($this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_image_band", array()), "content", array())) {
                    // line 19
                    echo "                    ";
                    echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_image_band", array()), "content", array()), "html", null, true));
                    echo "
                 ";
                } else {
                    // line 21
                    echo "                     ";
                    echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_tite", array()), "content", array()), "html", null, true));
                    echo "
                 ";
                }
                // line 23
                echo "            </a>
        </div>
        ";
            }
            // line 26
            echo "
    </div>




";
        }
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/views-view-fields--vue_slideshow_upjv.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  101 => 26,  96 => 23,  90 => 21,  84 => 19,  82 => 18,  76 => 16,  73 => 15,  67 => 13,  65 => 12,  60 => 10,  53 => 6,  48 => 3,  46 => 2,  43 => 1,);
    }
}
/* */
/* {% if fields.title.content is not null %}*/
/* */
/* */
/*     <div data-p="172.50" class="sliderDiv" >*/
/*         {{ fields.field_image.content }}*/
/*         <div class="newSlideJssor">*/
/* */
/* */
/*             <span class="typeDisplayTitre">{{ fields.title.content }}</span>*/
/*             <br>*/
/*             {% if fields.field_sous_titre.content is not null %}*/
/*                 <span class="typeDisplaySousTitre">{{ fields.field_sous_titre.content }}</span>*/
/*             {% endif %}*/
/*     {% if fields.field_url.content is not null %}*/
/*             <a href="{{ fields.field_url.content }}" class="righted">*/
/* */
/*                  {% if fields.field_image_band.content %}*/
/*                     {{  fields.field_image_band.content }}*/
/*                  {% else %}*/
/*                      {{  fields.field_tite.content }}*/
/*                  {% endif %}*/
/*             </a>*/
/*         </div>*/
/*         {% endif %}*/
/* */
/*     </div>*/
/* */
/* */
/* */
/* */
/* {% endif %}*/
