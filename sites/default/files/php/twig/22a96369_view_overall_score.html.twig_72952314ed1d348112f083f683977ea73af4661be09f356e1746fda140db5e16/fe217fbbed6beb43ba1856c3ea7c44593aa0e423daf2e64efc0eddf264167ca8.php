<?php

/* modules/yoast_seo/templates/view_overall_score.html.twig */
class __TwigTemplate_e27cb517dea651974c6784e6efc7163971a25f220a3825ae1e2f25892dd31213 extends Twig_Template
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
        $tags = array();
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array(),
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
        echo "<div id=\"yoast-seo-preview-widget\" class=\"yoast-seo-score-widget overallScore ";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["overall_score"]) ? $context["overall_score"] : null), "html", null, true));
        echo "\">
    <span class=\"score_circle\"></span>
    <span class=\"score_value\">";
        // line 3
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["overall_score"]) ? $context["overall_score"] : null), "html", null, true));
        echo "</span>
</div>";
    }

    public function getTemplateName()
    {
        return "modules/yoast_seo/templates/view_overall_score.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  49 => 3,  43 => 1,);
    }
}
/* <div id="yoast-seo-preview-widget" class="yoast-seo-score-widget overallScore {{ overall_score }}">*/
/*     <span class="score_circle"></span>*/
/*     <span class="score_value">{{ overall_score }}</span>*/
/* </div>*/
