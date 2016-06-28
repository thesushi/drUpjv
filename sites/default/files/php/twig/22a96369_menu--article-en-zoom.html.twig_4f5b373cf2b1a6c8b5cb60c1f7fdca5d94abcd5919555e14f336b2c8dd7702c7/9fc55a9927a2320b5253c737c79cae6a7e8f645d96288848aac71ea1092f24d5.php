<?php

/* themes/upjv/templates/menu--article-en-zoom.html.twig */
class __TwigTemplate_f87e6e6245cfd257732ad7a76c52c846b7b93ff47b5a940835f2f83c363e8fa3 extends Twig_Template
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
        $tags = array("import" => 1, "if" => 3, "for" => 7);
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('import', 'if', 'for'),
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
        $context["menus"] = $this;
        // line 2
        echo "
  ";
        // line 3
        if ((isset($context["items"]) ? $context["items"] : null)) {
            // line 4
            echo "      <div class=\"toolbox\">
          <div class=\"slidorion\">
              <div class=\"accordion\">
                  ";
            // line 7
            $context['_parent'] = $context;
            $context['_seq'] = twig_ensure_traversable((isset($context["items"]) ? $context["items"] : null));
            foreach ($context['_seq'] as $context["_key"] => $context["item"]) {
                // line 8
                echo "                      <div class=\"link-header\">
                          <a href=\"";
                // line 9
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "url", array()), "html", null, true));
                echo "\"><h3>";
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "title", array()), "html", null, true));
                echo "</h3></a>
                      </div>
                      <!-- .link-header -->

                  ";
            }
            $_parent = $context['_parent'];
            unset($context['_seq'], $context['_iterated'], $context['_key'], $context['item'], $context['_parent'], $context['loop']);
            $context = array_intersect_key($context, $_parent) + $_parent;
            // line 14
            echo "                  <!-- .link-header -->

                  <!-- .link-content --></div>
              <!-- #accordion --></div>
          <!-- .slidorion --></div>


  ";
        }
        // line 22
        echo "
";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/menu--article-en-zoom.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  85 => 22,  75 => 14,  62 => 9,  59 => 8,  55 => 7,  50 => 4,  48 => 3,  45 => 2,  43 => 1,);
    }
}
/* {% import _self as menus %}*/
/* */
/*   {% if items %}*/
/*       <div class="toolbox">*/
/*           <div class="slidorion">*/
/*               <div class="accordion">*/
/*                   {% for item in items %}*/
/*                       <div class="link-header">*/
/*                           <a href="{{ item.url }}"><h3>{{ item.title }}</h3></a>*/
/*                       </div>*/
/*                       <!-- .link-header -->*/
/* */
/*                   {% endfor %}*/
/*                   <!-- .link-header -->*/
/* */
/*                   <!-- .link-content --></div>*/
/*               <!-- #accordion --></div>*/
/*           <!-- .slidorion --></div>*/
/* */
/* */
/*   {% endif %}*/
/* */
/* */
