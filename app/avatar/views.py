# -*- coding: utf-8 -*-
"""Define the Avatar views.

Copyright (C) 2018 Gitcoin Core

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

"""
from tempfile import NamedTemporaryFile

from django.http import Http404, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from .utils import build_avatar_svg, handle_avatar_payload


def avatar(request):
    """Serve an avatar."""
    skin_tone = f"#{request.GET.get('skin_tone', '3F2918')}"
    preview = request.GET.get('preview', False)
    payload = {
        'background_color': f"#{request.GET.get('background', '781623')}",
        'icon_size': (int(request.GET.get('icon_width', 215)), int(request.GET.get('icon_height', 215))),
        'avatar_size': request.GET.get('avatar_size', None),
        'skin_tone': skin_tone,
    }

    customizable_components = ['clothing', 'ears', 'head', 'hair']
    flat_components = ['eyes', 'mouth', 'nose']

    req = request.GET.copy()
    for component in customizable_components:
        if component in req:
            comp_color_key = f'{component}_color' if component not in ['ears', 'head'] else 'skin_tone'
            payload[component] = {
                'primary_color': f"#{req.get(comp_color_key, '18C708')}",
                'item_type': req.get(component)
            }

    for component in flat_components:
        if component in req:
            payload[component] = req.get(component)

    if preview:
        with NamedTemporaryFile(mode='w+', suffix='.svg') as tmp:
            avatar_preview = build_avatar_svg(payload=payload, temp=True)
            avatar_preview.save(tmp.name)
            with open(tmp.name) as file:
                response = HttpResponse(file, content_type='image/svg+xml')
                return response
    else:
        result_path = build_avatar_svg(payload=payload)

        with open(result_path) as file:
            response = HttpResponse(file, content_type='image/svg+xml')
        return response


@csrf_exempt
def save_avatar(request):
    """Save the Avatar configuration."""
    from .models import Avatar
    if not request.user.is_authenticated or request.user.is_authenticated and not getattr(request.user, 'profile'):
        raise Http404

    profile = request.user.profile
    payload = handle_avatar_payload(request)
    try:
        avatar = Avatar.objects.create(config=payload)
        avatar.create_from_config(svg_name=profile.handle)
        profile.avatar_id = avatar.id
        profile.save()
    except Exception as e:
        print(f'Exception in save_avatar: {e}')
        raise Http404
    return HttpResponse(profile.avatar.svg.file, content_type='image/svg+xml')