<?php

/* themes/upjv/templates/views-view-fields--bloc_vous_etes.html.twig */
class __TwigTemplate_cc4becf4c86b9337698da05c4d5cbed0c819b524346d175d9e656d1fdc415fc8 extends Twig_Template
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
        if ( !(null === $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "title", array()), "content", array()))) {
            // line 2
            echo "    <li>
        <div class=\"vignette_deco\">
            <span></span>";
            // line 4
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "field_image_vous_etes_", array()), "content", array()), "html", null, true));
            echo "
        </div> ";
            // line 5
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["fields"]) ? $context["fields"] : null), "title", array()), "content", array()), "html", null, true));
            echo "

    </li>
";
        }
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/views-view-fields--bloc_vous_etes.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  53 => 5,  49 => 4,  45 => 2,  43 => 1,);
    }
}
/* {% if fields.title.content is not null %}*/
/*     <li>*/
/*         <div class="vignette_deco">*/
/*             <span></span>{{ fields.field_image_vous_etes_.content }}*/
/*         </div> {{ fields.title.content }}*/
/* */
/*     </li>*/
/* {% endif %}*/
