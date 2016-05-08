<?php

/* themes/upjv/templates/views-view-unformatted--vue_slideshow_upjv.html.twig */
class __TwigTemplate_595ea3dafeafec691a4203cc5595af64989e8d0218d8c03cb311142d8dfb3168 extends Twig_Template
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
        $tags = array("for" => 12);
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('for'),
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
        echo "<div id=\"jssor_1\" class=\"jssorSlideDiv\">
    <!-- Loading Screen -->
    <div data-u=\"loading\" class=\"loadingJssor\">
        <div class=\"filterJssor\">
            &nbsp;</div>
        <div class=\"loadingImgJssor\">
            &nbsp;</div>
    </div>

    <div data-u=\"slides\" class=\"divSlidesJssor\">

        ";
        // line 12
        $context['_parent'] = $context;
        $context['_seq'] = twig_ensure_traversable((isset($context["rows"]) ? $context["rows"] : null));
        foreach ($context['_seq'] as $context["_key"] => $context["row"]) {
            // line 13
            echo "
            ";
            // line 14
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["row"], "content", array()), "html", null, true));
            echo "

        ";
        }
        $_parent = $context['_parent'];
        unset($context['_seq'], $context['_iterated'], $context['_key'], $context['row'], $context['_parent'], $context['loop']);
        $context = array_intersect_key($context, $_parent) + $_parent;
        // line 17
        echo "

    </div>
    <!-- Arrow Navigator -->
    <span data-u=\"arrowleft\" class=\"jssora07l\"  data-autocenter=\"2\">&nbsp;</span>
    <span data-u=\"arrowright\" class=\"jssora07r\"  data-autocenter=\"2\">&nbsp;</span>
</div>
";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/views-view-unformatted--vue_slideshow_upjv.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  72 => 17,  63 => 14,  60 => 13,  56 => 12,  43 => 1,);
    }
}
/* <div id="jssor_1" class="jssorSlideDiv">*/
/*     <!-- Loading Screen -->*/
/*     <div data-u="loading" class="loadingJssor">*/
/*         <div class="filterJssor">*/
/*             &nbsp;</div>*/
/*         <div class="loadingImgJssor">*/
/*             &nbsp;</div>*/
/*     </div>*/
/* */
/*     <div data-u="slides" class="divSlidesJssor">*/
/* */
/*         {% for row in rows %}*/
/* */
/*             {{ row.content }}*/
/* */
/*         {% endfor %}*/
/* */
/* */
/*     </div>*/
/*     <!-- Arrow Navigator -->*/
/*     <span data-u="arrowleft" class="jssora07l"  data-autocenter="2">&nbsp;</span>*/
/*     <span data-u="arrowright" class="jssora07r"  data-autocenter="2">&nbsp;</span>*/
/* </div>*/
/* */
