<?php

/* themes/upjv/templates/menu--main.html.twig */
class __TwigTemplate_e0e601d4a0fb94017b1f2c7c8d8a05e6deb2ed413093207f22e296e55e13a1c4 extends Twig_Template
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
        $tags = array("import" => 19, "macro" => 30, "if" => 32, "for" => 39);
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('import', 'macro', 'if', 'for'),
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

        // line 18
        echo "
";
        // line 19
        $context["menus"] = $this;
        // line 20
        echo "
";
        // line 25
        echo "
<div id=\"menu\">
    <div id=\"menu_principal_deco\">
        ";
        // line 28
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->renderVar($context["menus"]->getmenu_links((isset($context["items"]) ? $context["items"] : null), 0)));
        echo "

        ";
        // line 59
        echo "    </div>
</div>";
    }

    // line 30
    public function getmenu_links($__items__ = null, $__menu_level__ = null)
    {
        $context = $this->env->mergeGlobals(array(
            "items" => $__items__,
            "menu_level" => $__menu_level__,
            "varargs" => func_num_args() > 2 ? array_slice(func_get_args(), 2) : array(),
        ));

        $blocks = array();

        ob_start();
        try {
            // line 31
            echo "        ";
            $context["menus"] = $this;
            // line 32
            echo "        ";
            if ((isset($context["items"]) ? $context["items"] : null)) {
                // line 33
                echo "
        ";
                // line 34
                if (((isset($context["menu_level"]) ? $context["menu_level"] : null) == 0)) {
                    // line 35
                    echo "        <ul id=\"menu_principal\" data-unfold-target=\"menu_principal\">
            ";
                } else {
                    // line 37
                    echo "            <ul>
                ";
                }
                // line 39
                echo "                ";
                $context['_parent'] = $context;
                $context['_seq'] = twig_ensure_traversable((isset($context["items"]) ? $context["items"] : null));
                foreach ($context['_seq'] as $context["_key"] => $context["item"]) {
                    // line 40
                    echo "
                    <li>
                        ";
                    // line 42
                    if ($this->getAttribute($context["item"], "in_active_trail", array())) {
                        // line 43
                        echo "                        <em>
                            ";
                    }
                    // line 45
                    echo "                            <a href=\"";
                    echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "url", array()), "html", null, true));
                    echo "\"> ";
                    echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($context["item"], "title", array()), "html", null, true));
                    echo "</a>
                            ";
                    // line 46
                    if ($this->getAttribute($context["item"], "in_active_trail", array())) {
                        // line 47
                        echo "                        </em>
                        ";
                    }
                    // line 49
                    echo "
                        ";
                    // line 50
                    if ($this->getAttribute($context["item"], "below", array())) {
                        // line 51
                        echo "                            ";
                        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->renderVar($context["menus"]->getmenu_links($this->getAttribute($context["item"], "below", array()), ((isset($context["menu_level"]) ? $context["menu_level"] : null) + 1))));
                        echo "
                        ";
                    }
                    // line 53
                    echo "
                    </li>
                ";
                }
                $_parent = $context['_parent'];
                unset($context['_seq'], $context['_iterated'], $context['_key'], $context['item'], $context['_parent'], $context['loop']);
                $context = array_intersect_key($context, $_parent) + $_parent;
                // line 56
                echo "            </ul>
            ";
            }
            // line 58
            echo "            ";
        } catch (Exception $e) {
            ob_end_clean();

            throw $e;
        }

        return ('' === $tmp = ob_get_clean()) ? '' : new Twig_Markup($tmp, $this->env->getCharset());
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/menu--main.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  149 => 58,  145 => 56,  137 => 53,  131 => 51,  129 => 50,  126 => 49,  122 => 47,  120 => 46,  113 => 45,  109 => 43,  107 => 42,  103 => 40,  98 => 39,  94 => 37,  90 => 35,  88 => 34,  85 => 33,  82 => 32,  79 => 31,  66 => 30,  61 => 59,  56 => 28,  51 => 25,  48 => 20,  46 => 19,  43 => 18,);
    }
}
/* {#*/
/* /***/
/*  * @file*/
/*  * Default theme implementation to display a menu.*/
/*  **/
/*  * Available variables:*/
/*  * - menu_name: The machine name of the menu.*/
/*  * - items: A nested list of menu items. Each menu item contains:*/
/*  *   - attributes: HTML attributes for the menu item.*/
/*  *   - below: The menu item child items.*/
/*  *   - title: The menu link title.*/
/*  *   - url: The menu link url, instance of \Drupal\Core\Url*/
/*  *   - localized_options: Menu link localized options.*/
/*  **/
/*  * @ingroup templates*/
/*  *//* */
/* #}*/
/* */
/* {% import _self as menus %}*/
/* */
/* {#*/
/*   We call a macro which calls itself to render the full tree.*/
/*   @see http://twig.sensiolabs.org/doc/tags/macro.html*/
/* #}*/
/* */
/* <div id="menu">*/
/*     <div id="menu_principal_deco">*/
/*         {{ menus.menu_links(items, 0) }}*/
/* */
/*         {% macro menu_links(items, menu_level) %}*/
/*         {% import _self as menus %}*/
/*         {% if items %}*/
/* */
/*         {% if menu_level == 0 %}*/
/*         <ul id="menu_principal" data-unfold-target="menu_principal">*/
/*             {% else %}*/
/*             <ul>*/
/*                 {% endif %}*/
/*                 {% for item in items %}*/
/* */
/*                     <li>*/
/*                         {% if item.in_active_trail %}*/
/*                         <em>*/
/*                             {% endif %}*/
/*                             <a href="{{ item.url }}"> {{ item.title }}</a>*/
/*                             {% if item.in_active_trail %}*/
/*                         </em>*/
/*                         {% endif %}*/
/* */
/*                         {% if item.below %}*/
/*                             {{ menus.menu_links(item.below, menu_level + 1) }}*/
/*                         {% endif %}*/
/* */
/*                     </li>*/
/*                 {% endfor %}*/
/*             </ul>*/
/*             {% endif %}*/
/*             {% endmacro %}*/
/*     </div>*/
/* </div>*/
