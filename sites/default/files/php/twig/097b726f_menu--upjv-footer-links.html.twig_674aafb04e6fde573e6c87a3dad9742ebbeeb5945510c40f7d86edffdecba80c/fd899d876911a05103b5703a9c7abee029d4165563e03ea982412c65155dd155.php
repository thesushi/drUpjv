<?php

/* themes/upjv/templates/menu--upjv-footer-links.html.twig */
class __TwigTemplate_2bff0be7dd5ef4183c4dd48db0685d904db89e1a19808a301eeee7141b5852fc extends Twig_Template
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
        $tags = array("import" => 1, "if" => 3, "for" => 5);
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
            echo "      <ul id=\"menu_pied_page\">
          ";
            // line 5
            $context['_parent'] = $context;
            $context['_seq'] = twig_ensure_traversable((isset($context["items"]) ? $context["items"] : null));
            foreach ($context['_seq'] as $context["_key"] => $context["item"]) {
                // line 6
                echo "              <li>
                  <a href=\"";
                // line 7
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "url", array()), "html", null, true));
                echo "\">
                      ";
                // line 8
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "title", array()), "html", null, true));
                echo "
                  </a>
              </li>

          ";
            }
            $_parent = $context['_parent'];
            unset($context['_seq'], $context['_iterated'], $context['_key'], $context['item'], $context['_parent'], $context['loop']);
            $context = array_intersect_key($context, $_parent) + $_parent;
            // line 13
            echo "      </ul>

  ";
        }
        // line 16
        echo "
";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/menu--upjv-footer-links.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  80 => 16,  75 => 13,  64 => 8,  60 => 7,  57 => 6,  53 => 5,  50 => 4,  48 => 3,  45 => 2,  43 => 1,);
    }
}
/* {% import _self as menus %}*/
/* */
/*   {% if items %}*/
/*       <ul id="menu_pied_page">*/
/*           {% for item in items %}*/
/*               <li>*/
/*                   <a href="{{ item.url }}">*/
/*                       {{ item.title }}*/
/*                   </a>*/
/*               </li>*/
/* */
/*           {% endfor %}*/
/*       </ul>*/
/* */
/*   {% endif %}*/
/* */
/* */
